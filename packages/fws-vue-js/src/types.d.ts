import type i18next from 'i18next'
import type { Emitter } from 'mitt'
import type { Route } from 'vue-router'
import type VueRouter from 'vue-router'
import type { ClientOnly } from './components/ssr/ClientOnly'
import type { Events } from './composables/event-bus'
import type {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  getContrastingTextColor,
} from './composables/templating'

export interface BreadcrumbLink {
  name: string
  to?: string
}
export interface NavLink {
  to: string
  isExternal?: boolean
  name: string
  childrens?: NavLink[]
  icon?: Component
  id?: string
}
export interface FilterDataItems {
  label: string
  req: boolean
  uid: string
  type: string
  restValue?: string
  options?: any[][]
  isHidden?: boolean
  default?: any | undefined
  formats?: Record<string, (value: any) => any>
  autocomplete?: (value: string) => Promise<any[]>
  formatRestValue?: (value: any) => any
  onChangeValue?: (form: any, value: any) => void
  focused?: boolean
}

export type $t = typeof i18next.t
export type $eventBus = Emitter<Events>
export type $cropText = typeof cropText
export type $formatBytes = typeof formatBytes
export type $formatTimeago = typeof formatTimeago
export type $formatDatetime = typeof formatDatetime
export type $formatDate = typeof formatDate
export type $getContrastingTextColor = typeof getContrastingTextColor

declare module 'vue' {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t
    $eventBus: Emitter<Events>
    $cropText: typeof cropText
    $formatBytes: typeof formatBytes
    $formatTimeago: typeof formatTimeago
    $formatDatetime: typeof formatDatetime
    $formatDate: typeof formatDate
    $getContrastingTextColor: typeof getContrastingTextColor
    $formatNumber: (value: number) => string
    $router: VueRouter
    $route: Route
  }
  export interface GlobalComponents {
    ClientOnly: typeof ClientOnly
  }
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t
    $eventBus: Emitter<Events>
    $cropText: typeof cropText
    $formatBytes: typeof formatBytes
    $formatTimeago: typeof formatTimeago
    $formatDatetime: typeof formatDatetime
    $formatDate: typeof formatDate
    $getContrastingTextColor: typeof getContrastingTextColor
    $formatNumber: (value: number) => string
    $router: VueRouter
    $route: Route
  }
  export interface GlobalComponents {
    ClientOnly: typeof ClientOnly
  }
}
