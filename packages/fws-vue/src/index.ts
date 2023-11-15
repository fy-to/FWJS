import type { Plugin, App } from "vue";
import i18next from "i18next";
import mitt from "mitt";
import { Emitter } from "mitt";
import { useServerRouter } from "./stores/serverRouter";
import { useEventBus, Events } from "./composables/event-bus";
import { i18nextPromise, useTranslation } from "./composables/translations";
import {
  initVueClient,
  initVueServer,
  isServerRendered,
} from "./composables/ssr";
import { useSeo } from "./composables/seo";
import { useUserStore, useUserCheck } from "./stores/user";
import { ClientOnly } from "./components/ssr/ClientOnly";
import {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
} from "./composables/templating";
import { useRest } from "./composables/rest";
export * from "./stores/serverRouter";

// Components/UI/Transitions
import SlideTransition from "./components/ui/transitions/SlideTransition.vue";
import ExpandTransition from "./components/ui/transitions/ExpandTransition.vue";
import CollapseTransition from "./components/ui/transitions/CollapseTransition.vue";
import ScaleTransition from "./components/ui/transitions/ScaleTransition.vue";
import FadeTransition from "./components/ui/transitions/FadeTransition.vue";

// Components/UI
import DefaultInput from "./components/ui/DefaultInput.vue";
import DefaultModal from "./components/ui/DefaultModal.vue";
import DefaultConfirm from "./components/ui/DefaultConfirm.vue";
import DefaultPaging from "./components/ui/DefaultPaging.vue";
import DefaultBreadcrumb from "./components/ui/DefaultBreadcrumb.vue";
import DefaultLoader from "./components/ui/DefaultLoader.vue";
import DefaultSidebar from "./components/ui/DefaultSidebar.vue";

// Components/FWS
import UserFlow from "./components/fws/UserFlow.vue";
import DataTable from "./components/fws/DataTable.vue";
import FilterData from "./components/fws/FilterData.vue";
import CmsArticleBoxed from "./components/fws/CmsArticleBoxed.vue";
import CmsArticleSingle from "./components/fws/CmsArticleSingle.vue";

import "./style.css";

function createFWS(): Plugin {
  const eventBus: Emitter<Events> = mitt<Events>();

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus;
        app.provide("fwsVueEventBus", eventBus);

        // i18next
        app.config.globalProperties.$t = i18next.t;
        app.provide("fwsVueTranslate", i18next.t);

        // Templating
        app.config.globalProperties.$cropText = cropText;
        app.config.globalProperties.$formatBytes = formatBytes;
        app.config.globalProperties.$formatTimeago = formatTimeago;
        app.config.globalProperties.$formatDatetime = formatDatetime;
        app.config.globalProperties.$formatDate = formatDate;

        app.component("ClientOnly", ClientOnly);
      }
    },
  };
}

declare module "vue" {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t;
    $eventBus: Emitter<Events>;
    $cropText: typeof cropText;
    $formatBytes: typeof formatBytes;
    $formatTimeago: typeof formatTimeago;
    $formatDatetime: typeof formatDatetime;
    $formatDate: typeof formatDate;
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
  useRest,

  // Components
  // UI/Transitions
  SlideTransition,
  ExpandTransition,
  CollapseTransition,
  ScaleTransition,
  FadeTransition,

  // UI
  DefaultInput,
  DefaultModal,
  DefaultConfirm,
  DefaultPaging,
  DefaultBreadcrumb,
  DefaultLoader,
  DefaultSidebar,

  // FWS
  UserFlow,
  DataTable,
  FilterData,
  CmsArticleBoxed,
  CmsArticleSingle,
};
