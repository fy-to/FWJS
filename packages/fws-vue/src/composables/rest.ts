import type { RestMethod, RestParams } from '@fy-/fws-js'
import { getMode, rest, stringHash } from '@fy-/fws-js'
import { useServerRouter } from '../stores/serverRouter'
import { useEventBus } from './event-bus'
import { isServerRendered } from './ssr'

export interface APIPaging {
  page_no: number
  results_per_page: number
  page_max: number
  page_max_relation: string
  count: number
}

export interface APIResult {
  result: 'redirect' | 'success' | 'error'
  param?: string
  code?: number
  error?: string
  request?: string
  time?: number
  token?: string
  paging?: APIPaging
  message?: string
  fvReject?: boolean
  data?: any
  status?: number
}

// Use Map with size limit for better performance than WeakMap in this case
const urlParseCache = new Map<string, string>()
const MAX_URL_CACHE_SIZE = 500

// Global request hash cache with size limit to prevent memory leaks
const globalHashCache = new Map<string, number>()
const MAX_HASH_CACHE_SIZE = 1000

// Track in-flight requests to avoid duplicates
const inFlightRequests = new Map<number, Promise<any>>()

// Reusable TextEncoder instance
const textEncoder = new TextEncoder()

// Detect if we're in SSR mode once and cache the result
let isSSRMode: boolean | null = null

const secret = import.meta.env.VITE_API_SECRET

// Memoized function to extract URL pathname and search for hashing
function getUrlForHash(url: string): string {
  const cached = urlParseCache.get(url)
  if (cached) return cached

  let urlForHash: string
  try {
    const urlParse = new URL(url)
    urlForHash = urlParse.pathname + urlParse.search
  }
  catch {
    urlForHash = url
  }

  // Implement LRU-like cache eviction for URL cache
  if (urlParseCache.size >= MAX_URL_CACHE_SIZE) {
    const firstKey = urlParseCache.keys().next().value
    if (firstKey !== undefined) {
      urlParseCache.delete(firstKey)
    }
  }

  urlParseCache.set(url, urlForHash)
  return urlForHash
}

// Check SSR mode with caching
function checkSSRMode(): boolean {
  if (isSSRMode === null) {
    isSSRMode = getMode() === 'ssr'
  }

  return isSSRMode
}

// Fast JSON.stringify for params with caching for common cases
const EMPTY_PARAMS = ''
function stringifyParams(params?: RestParams): string {
  if (!params) return EMPTY_PARAMS
  return JSON.stringify(params)
}

// Compute request hash with global caching and size limit
function computeRequestHash(url: string, method: RestMethod, params?: RestParams): number {
  const cacheKey = `${url}|${method}|${stringifyParams(params)}`

  const cached = globalHashCache.get(cacheKey)
  if (cached !== undefined) return cached

  const urlForHash = getUrlForHash(url)
  const hash = stringHash(urlForHash + method + stringifyParams(params))

  // Implement LRU-like cache eviction when size limit is reached
  if (globalHashCache.size >= MAX_HASH_CACHE_SIZE) {
    // Delete the first (oldest) entry
    const firstKey = globalHashCache.keys().next().value
    if (firstKey !== undefined) {
      globalHashCache.delete(firstKey)
    }
  }

  globalHashCache.set(cacheKey, hash)
  return hash
}

function str2ab(str: string): Uint8Array {
  return textEncoder.encode(str)
}

// Create HMAC signature with proper typing
async function createHMACSignature(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    str2ab(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    str2ab(data),
  )

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export function useRest(): <ResultType extends APIResult>(
url: string,
method: RestMethod,
params?: RestParams,
) => Promise<ResultType> {
  const serverRouter = useServerRouter()
  const eventBus = useEventBus()

  // Pre-check for server rendering state
  const isSSR = isServerRendered()

  // Handle API error response consistently - memoize emitter functions
  const emitMainLoading = (value: boolean) => eventBus.emit('main-loading', value)
  const emitRestError = (result: any) => eventBus.emit('rest-error', result)

  // Pre-bind emit functions to avoid recreation
  const boundEmitMainLoading = emitMainLoading
  const boundEmitRestError = emitRestError

  function handleErrorResult<ResultType extends APIResult>(result: ResultType): Promise<ResultType> {
    boundEmitMainLoading(false)
    boundEmitRestError(result)
    return Promise.reject(result)
  }

  return async <ResultType extends APIResult>(
    url: string,
    method: RestMethod,
    params?: RestParams,
  ): Promise<ResultType> => {
    const requestHash = computeRequestHash(url, method, params)

    // Check for server-rendered results first
    if (isSSR) {
      const hasResult = serverRouter.getResult(requestHash)
      if (hasResult !== undefined) {
        const result = hasResult as ResultType
        serverRouter.removeResult(requestHash)

        if (result.result === 'error') {
          return handleErrorResult(result)
        }

        return Promise.resolve(result)
      }
    }

    // Check if this exact request is already in-flight
    const existingRequest = inFlightRequests.get(requestHash)
    if (existingRequest) {
      // Return the existing promise for the in-flight request
      return existingRequest
    }

    // Create the actual request function
    const performRequest = async (): Promise<ResultType> => {
      const h: { [key: string]: string } = {}

      if (secret && secret !== '') {
        const timestamp = Date.now()
        const dataToSign = `${method}${url}${timestamp}`
        const signature = await createHMACSignature(secret, dataToSign)

        h['X-Timestamp'] = timestamp.toString()
        h['X-Signature'] = signature
      }

      try {
        const restResult: ResultType = await rest(url, method, params, h)

        // Store result in server router if in SSR mode
        if (checkSSRMode()) {
          // Use structuredClone if available for better performance than JSON.parse/stringify
          const resultCopy = typeof structuredClone !== 'undefined'
            ? structuredClone(restResult)
            : JSON.parse(JSON.stringify(restResult))

          serverRouter.addResult(requestHash, resultCopy)
        }

        if (restResult.result === 'error') {
          return handleErrorResult(restResult)
        }

        return Promise.resolve(restResult)
      }
      catch (error) {
        const restError = error as ResultType

        if (checkSSRMode()) {
          serverRouter.addResult(requestHash, restError)
        }

        boundEmitMainLoading(false)
        boundEmitRestError(restError)
        return Promise.resolve(restError)
      }
      finally {
        // Always remove from in-flight requests when done
        inFlightRequests.delete(requestHash)
      }
    }

    // Track this request as in-flight
    const requestPromise = performRequest()
    inFlightRequests.set(requestHash, requestPromise)

    return requestPromise
  }
}
