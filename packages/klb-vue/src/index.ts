import type { Emitter } from 'mitt'
import type { App, Plugin } from 'vue'
import type { Events } from './composables/event-bus'
import i18next from 'i18next'
import mitt from 'mitt'
import CmsPage from './components/klb/CmsPage.vue'
import DataTable from './components/klb/DataTable.vue'
import FilterData from './components/klb/FilterData.vue'
import KlbBillingHistory from './components/klb/KlbBillingHistory.vue'
import KlbContact from './components/klb/KlbContact.vue'
import KlbUpdateEmail from './components/klb/KlbUpdateEmail.vue'
import KlbUpdatePassword from './components/klb/KlbUpdatePassword.vue'
// Components/KLB
import UserFlow from './components/klb/UserFlow.vue'
import { ClientOnly } from './components/ssr/ClientOnly'
import DefaultBreadcrumb from './components/ui/DefaultBreadcrumb.vue'
import DefaultConfirm from './components/ui/DefaultConfirm.vue'
import DefaultDateSelection from './components/ui/DefaultDateSelection.vue'
import DefaultGallery from './components/ui/DefaultGallery.vue'
// Components/UI
import DefaultInput from './components/ui/DefaultInput.vue'

import DefaultLoader from './components/ui/DefaultLoader.vue'
import DefaultModal from './components/ui/DefaultModal.vue'
import DefaultNotif from './components/ui/DefaultNotif.vue'
import DefaultPaging from './components/ui/DefaultPaging.vue'
import DefaultSidebar from './components/ui/DefaultSidebar.vue'

import DefaultStepper from './components/ui/DefaultStepper.vue'
import DefaultTable from './components/ui/DefaultTable.vue'
import DefaultTagInput from './components/ui/DefaultTagInput.vue'
import CollapseTransition from './components/ui/transitions/CollapseTransition.vue'
import ExpandTransition from './components/ui/transitions/ExpandTransition.vue'
import FadeTransition from './components/ui/transitions/FadeTransition.vue'
import ScaleTransition from './components/ui/transitions/ScaleTransition.vue'
// Components/UI/Transitions
import SlideTransition from './components/ui/transitions/SlideTransition.vue'
import { useAudioRecorder } from './composables/audioRecorder'
import { useCart } from './composables/cart'
import { useEventBus } from './composables/event-bus'
import { useKlbAgent } from './composables/klbAgent'
import { useKlbAgentSpeech } from './composables/KlbAgentSpeech'
import { useRest } from './composables/rest'
import { useSeo } from './composables/seo'
import { useSpeechRecognition } from './composables/speechRecognition'
import { i18nextPromise, useTranslation } from './composables/translations'
import { initVueClient, initVueServer, isServerRendered } from './misc/ssr'
import {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatRecurringPaymentCycle,
  formatTimeago,
} from './misc/templating'
import { useServerRouter } from './stores/serverRouter'
import { useKlbStore, useUserCheck } from './stores/user'
import './style.css'

export * from './composables/countries'
export * from './stores/catalog'
export * from './stores/serverRouter'
export * from './types/klb.d'
export * from './types/types.d'

function createKLB(): Plugin {
  // @ts-expect-error: Emitter<Events> is not assignable to Emitter<Events>
  const eventBus: Emitter<Events> = mitt<Events>()

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus
        app.provide('klbVueEventBus', eventBus)

        // i18next
        app.config.globalProperties.$t = i18next.t
        app.provide('klbVueTranslate', i18next.t)

        // Templating
        app.config.globalProperties.$cropText = cropText
        app.config.globalProperties.$formatBytes = formatBytes
        app.config.globalProperties.$formatTimeago = formatTimeago
        app.config.globalProperties.$formatDatetime = formatDatetime
        app.config.globalProperties.$formatDate = formatDate
        app.config.globalProperties.$formatRecurringPaymentCycle = formatRecurringPaymentCycle

        app.component('ClientOnly', ClientOnly)
      }
    },
  }
}

export {
  ClientOnly,
  CmsPage,
  CollapseTransition,
  createKLB,
  DataTable,
  DefaultBreadcrumb,
  DefaultConfirm,
  DefaultDateSelection,
  DefaultGallery,
  // UI
  DefaultInput,
  DefaultLoader,
  DefaultModal,
  DefaultNotif,
  DefaultPaging,
  DefaultSidebar,
  DefaultStepper,
  DefaultTable,
  DefaultTagInput,
  ExpandTransition,
  FadeTransition,
  FilterData,
  i18nextPromise,
  initVueClient,

  initVueServer,
  isServerRendered,
  KlbBillingHistory,
  KlbContact,
  KlbUpdateEmail,
  KlbUpdatePassword,
  ScaleTransition,
  // Components
  // UI/Transitions
  SlideTransition,
  useAudioRecorder,
  useCart,
  useEventBus,
  useKlbAgent,
  useKlbAgentSpeech,

  useKlbStore,
  useRest,
  // KLB
  UserFlow,
  useSeo,
  useServerRouter,
  useSpeechRecognition,
  useTranslation,
  useUserCheck,
}
