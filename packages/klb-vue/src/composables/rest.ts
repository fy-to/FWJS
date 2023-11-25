import { useRestStore } from "../stores/rest";
import { isServerRendered } from "../misc/ssr";
import { useEventBus } from "./event-bus";
import { stringHash } from "../misc/utils";
import { rest as _rest, getMode } from "@karpeleslab/klbfw";

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
  method: any,
  params?: any,
) => Promise<ResultType> {
  const restStore = useRestStore();
  const eventBus = useEventBus();

  return async <ResultType extends APIResult>(
    url: string,
    method: any,
    params: any = {},
    ctx: any = {},
  ): Promise<ResultType> => {
    const requestHash = stringHash(url + method + JSON.stringify(params));
    if (isServerRendered()) {
      const hasResult = restStore.getResult(requestHash);
      if (hasResult !== undefined) {
        const result = JSON.parse(JSON.stringify(hasResult)) as ResultType;
        restStore.removeResult(requestHash);
        if (result.result === "error") {
          eventBus.emit("rest-error", result);
          return Promise.reject(result);
        }
        return Promise.resolve(result);
      }
    }

    try {
      const restResult: ResultType = await _rest(url, method, params, ctx);
      if (getMode() === "ssr") {
        restStore.addResult(
          requestHash,
          JSON.parse(JSON.stringify(restResult)),
        );
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
