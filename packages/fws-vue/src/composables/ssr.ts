import { Router } from "vue-router";
import { Pinia } from "pinia";
import { renderToString } from "@vue/server-renderer";
import { getInitialState, getPath, getURL, getUUID } from "@fy-/fws-js";
import { useServerRouter } from "../stores/serverRouter";

export interface SSRResult {
  initial: {
    isSSR: boolean;
    pinia?: string;
  };
  uuid?: string;
  meta?: string;
  link?: string;
  bodyAttributes?: string;
  htmlAttributes?: string;
  bodyTags?: string;
  app?: string;
  statusCode?: number;
  redirect?: string;
}

export function isServerRendered() {
  const state = getInitialState();
  if (state && state.isSSR) return true;
  return false;
}

export function initVueClient(router: Router, pinia: Pinia) {
  const state = getInitialState();
  if (state.isSSR && state && state.pinia) {
    pinia.state.value = state.pinia;
  }
  useServerRouter(pinia)._setRouter(router);
}

export async function initVueServer(
  createApp: Function,
  callback: Function,
  options: { url?: string } = {},
) {
  const url =
    options.url || `${getPath()}${getURL().Query ? `?${getURL().Query}` : ""}`;
  const { app, router, head, pinia } = await createApp(true);
  await router.push(url);
  await router.isReady();
  const serverRouter = useServerRouter(pinia);
  serverRouter._setRouter(router);

  const result: SSRResult = {
    uuid: getUUID(),
    initial: {
      isSSR: true,
      pinia: undefined,
    },
  };

  if (url !== serverRouter.route.fullPath) {
    result.redirect = serverRouter.route.value.fullPath;
    result.statusCode = 307;
    callback(result);
    return result;
  }

  try {
    const html = await renderToString(app);
    const { headTags, htmlAttrs, bodyAttrs, bodyTags } =
      head.renderHeadToString();

    result.meta = headTags;
    result.bodyAttributes = bodyAttrs;
    result.htmlAttributes = htmlAttrs;
    result.bodyTags = bodyTags;
    result.app = html;
    if (serverRouter.status != 200) {
      if ([301, 302, 303, 307].includes(serverRouter.status)) {
        if (serverRouter.redirect) {
          result.statusCode = serverRouter.status;
          result.redirect = serverRouter.redirect;
        }
      } else {
        result.statusCode = serverRouter.status;
      }
    }

    serverRouter._router = null;
    result.initial.pinia = pinia.state.value;
    callback(result);
    return result;
  } catch (error) {
    //console.error(error);
    result.statusCode = 500;
    const err =
      error instanceof Error ? `${error.message}\n${error.stack}` : error;
    result.app = `<pre>${err}</pre>`;
    callback(result);
    return result;
  }
}
