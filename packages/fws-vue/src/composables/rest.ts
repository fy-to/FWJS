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

// Cache for URL parsing to avoid repeated parsing of the same URL
const urlParseCache = new Map<string, string>()

// Global request hash cache shared across all instances
const globalHashCache = new Map<string, number>()

// Track in-flight requests to avoid duplicates
const inFlightRequests = new Map<number, Promise<any>>()

// Detect if we're in SSR mode once and cache the result
let isSSRMode: boolean | null = null

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

// Fast JSON.stringify for params
function stringifyParams(params?: RestParams): string {
  return params ? JSON.stringify(params) : ''
}

// Compute request hash with global caching
function computeRequestHash(url: string, method: RestMethod, params?: RestParams): number {
  const cacheKey = `${url}|${method}|${stringifyParams(params)}`

  const cached = globalHashCache.get(cacheKey)
  if (cached !== undefined) return cached

  const urlForHash = getUrlForHash(url)
  const hash = stringHash(urlForHash + method + stringifyParams(params))

  globalHashCache.set(cacheKey, hash)
  return hash
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

  // Handle API error response consistently
  function handleErrorResult<ResultType extends APIResult>(result: ResultType): Promise<ResultType> {
    eventBus.emit('main-loading', false)
    eventBus.emit('rest-error', result)
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
      try {
        const restResult: ResultType = await rest(url, method, params)

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

        eventBus.emit('main-loading', false)
        eventBus.emit('rest-error', restError)
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
