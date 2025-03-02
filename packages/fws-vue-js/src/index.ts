import type { Emitter } from 'mitt'
import type { App, Plugin } from 'vue'
import type { Events } from './composables/event-bus'
import i18next from 'i18next'
import mitt from 'mitt'

import { ClientOnly } from './components/ssr/ClientOnly'

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

export * from './stores/serverRouter'
export type * from './types'

function createFWS(): Plugin {
  // @ts-expect-error: Emitter<Events> is not assignable to Emitter<Events>
  const eventBus: Emitter<Events> = mitt<Events>()

  return {
    install(app: App) {
      if (app.config.globalProperties) {
        app.config.globalProperties.$eventBus = eventBus
        app.provide('fwsVueEventBus', eventBus)

        // i18next
        app.config.globalProperties.$t = i18next.t
        app.provide('fwsVueTranslate', i18next.t)

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

  createFWS,
  i18nextPromise,
  initVueClient,
  initVueServer,
  isServerRendered,
  useEventBus,
  useRest,
  useSeo,
  useServerRouter,
  useTranslation,
  useUserCheck,
  useUserCheckAsync,
  useUserCheckAsyncSimple,
  useUserStore,
}
