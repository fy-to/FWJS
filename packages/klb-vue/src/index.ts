import type { Plugin, App } from "vue";
import i18next from "i18next";
import mitt from "mitt";
import { Emitter } from "mitt";
import { useServerRouter } from "./stores/serverRouter";
import { useAudioRecorder } from "./composables/audioRecorder";
import { useKlbAgent } from "./composables/klbAgent";
import { useSpeechRecognition } from "./composables/speechRecognition";
import { useKlbAgentSpeech } from "./composables/KlbAgentSpeech";
import { useEventBus, Events } from "./composables/event-bus";
import { i18nextPromise, useTranslation } from "./composables/translations";
import { initVueClient, initVueServer, isServerRendered } from "./misc/ssr";
import { useSeo } from "./composables/seo";
import { useKlbStore, useUserCheck } from "./stores/user";
import { ClientOnly } from "./components/ssr/ClientOnly";
import { useCart } from "./composables/cart";
import {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  formatRecurringPaymentCycle,
} from "./misc/templating";
import { useRest } from "./composables/rest";
export * from "./stores/catalog";
export * from "./stores/serverRouter";
export * from "./types/klb.d";
export * from "./types/types.d";
export * from "./composables/countries";

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
import DefaultDateSelection from "./components/ui/DefaultDateSelection.vue";
import DefaultStepper from "./components/ui/DefaultStepper.vue";
import DefaultTable from "./components/ui/DefaultTable.vue";
import DefaultTagInput from "./components/ui/DefaultTagInput.vue";
import DefaultGallery from "./components/ui/DefaultGallery.vue";
// Components/KLB
import UserFlow from "./components/klb/UserFlow.vue";
import CmsPage from "./components/klb/CmsPage.vue";
import DataTable from "./components/klb/DataTable.vue";
import FilterData from "./components/klb/FilterData.vue";
import KlbBillingHistory from "./components/klb/KlbBillingHistory.vue";
import KlbUpdateEmail from "./components/klb/KlbUpdateEmail.vue";
import KlbUpdatePassword from "./components/klb/KlbUpdatePassword.vue";
import KlbContact from "./components/klb/KlbContact.vue";
import "./style.css";

function createKLB(): Plugin {
  const eventBus: Emitter<Events> = mitt<Events>();

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus;
        app.provide("klbVueEventBus", eventBus);

        // i18next
        app.config.globalProperties.$t = i18next.t;
        app.provide("klbVueTranslate", i18next.t);

        // Templating
        app.config.globalProperties.$cropText = cropText;
        app.config.globalProperties.$formatBytes = formatBytes;
        app.config.globalProperties.$formatTimeago = formatTimeago;
        app.config.globalProperties.$formatDatetime = formatDatetime;
        app.config.globalProperties.$formatDate = formatDate;
        app.config.globalProperties.$formatRecurringPaymentCycle =
          formatRecurringPaymentCycle;

        app.component("ClientOnly", ClientOnly);
      }
    },
  };
}

export {
  i18nextPromise,
  useTranslation,
  createKLB,
  useServerRouter,
  useEventBus,
  initVueClient,
  initVueServer,
  isServerRendered,
  useSeo,
  useKlbStore,
  useUserCheck,
  useRest,
  useCart,
  ClientOnly,
  useAudioRecorder,
  useKlbAgent,
  useSpeechRecognition,
  useKlbAgentSpeech,
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
  DefaultDateSelection,
  DefaultStepper,
  DefaultTable,
  DefaultTagInput,
  DefaultGallery,

  // KLB
  UserFlow,
  CmsPage,
  DataTable,
  FilterData,
  KlbBillingHistory,
  KlbUpdateEmail,
  KlbUpdatePassword,
  KlbContact,
};
