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

export function useRest(): <ResultType extends APIResult>(
url: string,
method: RestMethod,
params?: RestParams,
) => Promise<ResultType> {
  const serverRouter = useServerRouter()
  const eventBus = useEventBus()

  return async <ResultType extends APIResult>(
    url: string,
    method: RestMethod,
    params?: RestParams,
  ): Promise<ResultType> => {
    let urlForHash: string = url
    try {
      const urlParse = new URL(url)
      urlForHash = urlParse.pathname + urlParse.search
    }
    catch {
      urlForHash = url
    }

    const requestHash = stringHash(
      urlForHash + method + JSON.stringify(params),
    )
    if (isServerRendered()) {
      const hasResult = serverRouter.getResult(requestHash)
      if (hasResult !== undefined) {
        const result = hasResult as ResultType
        serverRouter.removeResult(requestHash)
        if (result.result === 'error') {
          eventBus.emit('main-loading', false)
          eventBus.emit('rest-error', result)
          return Promise.reject(result)
        }
        return Promise.resolve(result)
      }
    }

    try {
      const restResult: ResultType = await rest(url, method, params)
      if (getMode() === 'ssr') {
        serverRouter.addResult(
          requestHash,
          JSON.parse(JSON.stringify(restResult)),
        )
      }
      if (restResult.result === 'error') {
        eventBus.emit('main-loading', false)
        eventBus.emit('rest-error', restResult)
        return Promise.reject(restResult)
      }
      return Promise.resolve(restResult)
    }
    catch (error) {
      const restError: ResultType = error as ResultType
      if (getMode() === 'ssr') {
        serverRouter.addResult(requestHash, restError)
      }
      eventBus.emit('main-loading', false)
      eventBus.emit('rest-error', restError)
      return Promise.resolve(restError)
    }
  }
}
