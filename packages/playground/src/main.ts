import { createApp as createRegularApp, createSSRApp } from "vue";
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from "vue-router";
import { getPrefix } from "@fy-/fws-js";
import { createFWS } from "@fy-/fws-vue";
import { createFyHead } from "@fy-/head";
import { createPinia } from "pinia";
import App from "./AppSuspender.vue";
import routes from "./routes";
import "./style.css";
export const createApp = async (isSSR: boolean) => {
  const pinia = createPinia();
  const fws = createFWS();
  const head = createFyHead();

  const app = isSSR ? createSSRApp(App) : createRegularApp(App);
  const router = createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory(getPrefix())
      : createWebHistory(getPrefix()),
    routes,
    scrollBehavior(to) {
      if (to.hash) {
        return {
          el: to.hash,
        };
      }
    },
  });
  router.afterEach((to) => {
    if (typeof window !== "undefined" && !to.hash) window.scrollTo(0, 0);
  });
  app.use(router);
  app.use(pinia);
  app.use(head);
  app.use(fws);

  return { app, router, head, pinia };
};
