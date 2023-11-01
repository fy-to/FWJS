import { RestMethod, RestParams, getMode, rest, stringHash } from "@fy-/fws-js";
import { useRestStore } from "./stores/rest";
import { isServerRendered } from "./ssr";
import { useEventBus } from "./event-bus";

export interface APIPaging {
  page_no: number;
  results_per_page: number;
  page_max: number;
  page_max_relation: string;
  count: number;
}

export interface APIResult {
  result: "redirect" | "success" | "error";
  param?: string;
  code?: number;
  error?: string;
  request?: string;
  time?: number;
  token?: string;
  paging?: APIPaging;
  message?: string;
  fvReject?: boolean;
  data?: any;
  status?: number;
}

export function useRest(): <ResultType extends APIResult>(
  url: string,
  method: RestMethod,
  params?: RestParams,
) => Promise<ResultType> {
  const restStore = useRestStore();
  const eventBus = useEventBus();

  return async <ResultType extends APIResult>(
    url: string,
    method: RestMethod,
    params?: RestParams,
  ): Promise<ResultType> => {
    const requestHash = stringHash(url + method + JSON.stringify(params));
    if (isServerRendered()) {
      const hasResult = restStore.getResult(requestHash);
      if (hasResult !== undefined) {
        const result = { ...hasResult } as ResultType;
        restStore.removeResult(requestHash);
        if (result.result === "error") {
          eventBus.emit("rest-error", result);
          return Promise.reject(result);
        }
        return Promise.resolve(result);
      }
    }

    try {
      const restResult: ResultType = await rest(url, method, params);
      if (getMode() === "ssr") {
        restStore.addResult(requestHash, restResult);
      }
      return Promise.resolve(restResult);
    } catch (error) {
      const restError: ResultType = error as ResultType;
      if (getMode() === "ssr") {
        restStore.addResult(requestHash, restError);
      }

      eventBus.emit("rest-error", restError);
      return Promise.resolve(restError);
    }
  };
}
