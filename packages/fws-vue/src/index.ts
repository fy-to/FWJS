import type { Plugin, App } from "vue";
import i18next from "i18next";
import mitt from "mitt";
import { useServerRouter } from "./stores/serverRouter";
import { useEventBus, EventBus, Events } from "./event-bus";
import { i18nextPromise } from "./translations";
import { initVueClient, initVueServer } from "./ssr";
import { ClientOnly } from "./components/ClientOnly";
export * from "./stores/serverRouter";

function createFWS(): Plugin {
  const eventBus: EventBus = mitt<Events>();

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus;
        app.provide("fws-event-bus", eventBus);

        // i18next
        app.config.globalProperties.$t = i18next.t;
        app.provide("fws-translate", i18next.t);

        app.component("ClientOnly", ClientOnly);
      }
    },
  };
}

declare module "vue" {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t;
    $eventBus: EventBus;
  }
  export interface GlobalComponents {
    ClientOnly: typeof ClientOnly;
  }
}

export {
  i18nextPromise,
  createFWS,
  useServerRouter,
  useEventBus,
  initVueClient,
  initVueServer,
};
