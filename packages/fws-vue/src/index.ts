import type { Plugin, App } from "vue";
import i18next from "i18next";
import mitt from "mitt";
import { useServerRouter } from "./stores/serverRouter";
import { useEventBus, EventBus, Events } from "./event-bus";
import { i18nextPromise, useTranslation } from "./translations";
import { initVueClient, initVueServer, isServerRendered } from "./ssr";
import { useSeo } from "./seo";
import { useUserStore, useUserCheck } from "./stores/user";
import { ClientOnly } from "./components/ssr/ClientOnly";
export * from "./stores/serverRouter";

// Components/UI/Transitions
import SlideTransition from "./components/ui/transitions/SlideTransition.vue";
import ExpandTransition from "./components/ui/transitions/ExpandTransition.vue";
import CollapseTransition from "./components/ui/transitions/CollapseTransition.vue";
import ScaleTransition from "./components/ui/transitions/ScaleTransition.vue";
import FadeTransition from "./components/ui/transitions/FadeTransition.vue";

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
  useTranslation,
  createFWS,
  useServerRouter,
  useEventBus,
  initVueClient,
  initVueServer,
  isServerRendered,
  useSeo,
  useUserStore,
  useUserCheck,

  // Components
  // UI/Transitions
  SlideTransition,
  ExpandTransition,
  CollapseTransition,
  ScaleTransition,
  FadeTransition,
};
