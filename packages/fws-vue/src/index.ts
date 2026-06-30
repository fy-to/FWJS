import type { TFunction } from 'i18next'
import type { Emitter } from 'mitt'
import type { App, Plugin } from 'vue'
import type { Events } from './composables/event-bus'
import i18next from 'i18next'
import mitt from 'mitt'
import { shallowRef } from 'vue'
import CmsArticleBoxed from './components/fws/CmsArticleBoxed.vue'
import CmsArticleSingle from './components/fws/CmsArticleSingle.vue'
import DataTable from './components/fws/DataTable.vue'
import FilterData from './components/fws/FilterData.vue'
import UserData from './components/fws/UserData.vue'
// Components/FWS
import UserFlow from './components/fws/UserFlow.vue'
import UserOAuth2 from './components/fws/UserOAuth2.vue'
import UserProfile from './components/fws/UserProfile.vue'

import UserProfileStrict from './components/fws/UserProfileStrict.vue'
import { ClientOnly } from './components/ssr/ClientOnly'
import DefaultBreadcrumb from './components/ui/DefaultBreadcrumb.vue'
import DefaultConfirm from './components/ui/DefaultConfirm.vue'
import DefaultConfirmWithInput from './components/ui/DefaultConfirmWithInput.vue'
import DefaultDropdown from './components/ui/DefaultDropdown.vue'

import DefaultDropdownLink from './components/ui/DefaultDropdownLink.vue'
import DefaultGallery from './components/ui/DefaultGallery.vue'
// Components/UI
import DefaultInput from './components/ui/DefaultInput.vue'
import DefaultLoader from './components/ui/DefaultLoader.vue'
import DefaultModal from './components/ui/DefaultModal.vue'
import DefaultNotif from './components/ui/DefaultNotif.vue'
import DefaultPaging from './components/ui/DefaultPaging.vue'
import DefaultSidebar from './components/ui/DefaultSidebar.vue'
import DefaultTagInput from './components/ui/DefaultTagInput.vue'
import CollapseTransition from './components/ui/transitions/CollapseTransition.vue'
import ExpandTransition from './components/ui/transitions/ExpandTransition.vue'
import FadeTransition from './components/ui/transitions/FadeTransition.vue'
import ScaleTransition from './components/ui/transitions/ScaleTransition.vue'
// Components/UI/Transitions
import SlideTransition from './components/ui/transitions/SlideTransition.vue'
import { useEventBus } from './composables/event-bus'
import { useRest } from './composables/rest'
import { useSeo } from './composables/seo'
import {
  initVueClient,
  initVueServer,
  isServerRendered,
} from './composables/ssr'
import {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
} from './composables/templating'
import { i18nextPromise, useTranslation } from './composables/translations'
import { useServerRouter } from './stores/serverRouter'
import {
  useUserCheck,
  useUserCheckAsync,
  useUserCheckAsyncSimple,
  useUserStore,
} from './stores/user'
// Css
import './style.css'

export * from './stores/serverRouter'
export type * from './types'

function createFWS(): Plugin {
  // @ts-expect-error: Emitter<Events> is not assignable to Emitter<Events>
  const eventBus: Emitter<Events> = mitt<Events>()

  // i18next's `t` is NOT reactive. If a component renders a key during a window
  // where the resource isn't loaded yet (cold deep-link, client-nav before a late
  // locale fetch, hydration race) it paints the RAW token and Vue never re-renders
  // — nothing reactive changed, so the miss sticks. Wrap `t` so it depends on a
  // tick bumped by i18next's own events: any raw key then self-heals the instant
  // resources land, and `changeLanguage` live-updates every string. Client-only:
  // on the server strings are already resolved by the `await i18nextPromise` before
  // render, and `install()` runs per-request there — adding listeners to the global
  // i18next singleton each request would leak. So SSR keeps the plain `t`.
  let translate: TFunction = i18next.t
  if (typeof window !== 'undefined') {
    const tick = shallowRef(0)
    const bump = (): void => {
      tick.value++
    }
    i18next.on('loaded', bump)
    i18next.on('added', bump)
    i18next.on('languageChanged', bump)
    const rawT = i18next.t as unknown as (...a: unknown[]) => unknown
    translate = ((...args: Parameters<typeof i18next.t>) => {
      void tick.value
      return rawT(...args)
    }) as unknown as TFunction
  }

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus
        app.provide('fwsVueEventBus', eventBus)

        // i18next (reactive wrapper — see note above)
        app.config.globalProperties.$t = translate
        app.provide('fwsVueTranslate', translate)

        // Templating
        app.config.globalProperties.$cropText = cropText
        app.config.globalProperties.$formatBytes = formatBytes
        app.config.globalProperties.$formatTimeago = formatTimeago
        app.config.globalProperties.$formatDatetime = formatDatetime
        app.config.globalProperties.$formatDate = formatDate
        app.config.globalProperties.$getContrastingTextColor
          = getContrastingTextColor

        app.component('ClientOnly', ClientOnly)
      }
    },
  }
}

export {
  CmsArticleBoxed,
  CmsArticleSingle,
  CollapseTransition,
  createFWS,
  cropText as cropTextFunction,
  DataTable,
  DefaultBreadcrumb,
  DefaultConfirm,
  DefaultConfirmWithInput,
  DefaultDropdown,
  DefaultDropdownLink,
  DefaultGallery,
  // UI
  DefaultInput,
  DefaultLoader,
  DefaultModal,

  DefaultNotif,
  DefaultPaging,
  DefaultSidebar,
  DefaultTagInput,
  ExpandTransition,

  FadeTransition,
  FilterData,
  formatBytes as formatBytesFunction,
  formatDate as formatDateFunction,
  formatDatetime as formatDatetimeFunction,
  formatTimeago as formatTimeagoFunction,
  getContrastingTextColor as getContrastingTextColorFunction,
  i18nextPromise,
  initVueClient,
  initVueServer,
  isServerRendered,
  ScaleTransition,

  // Components
  // UI/Transitions
  SlideTransition,
  useEventBus,
  UserData,
  useRest,
  // FWS
  UserFlow,
  UserOAuth2,
  UserProfile,
  UserProfileStrict,
  useSeo,

  useServerRouter,
  useTranslation,
  useUserCheck,
  useUserCheckAsync,
  useUserCheckAsyncSimple,
  useUserStore,
}
