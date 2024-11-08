import {
  cropText,
  formatBytes,
  formatDate,
  formatDatetime,
  formatTimeago,
  formatRecurringPaymentCycle,
} from "./misc/templating";
import { Emitter } from "mitt";
import { Events } from "./composables/event-bus";
import i18next from "i18next";
import { ClientOnly } from "./components/ssr/ClientOnly";
import type { Route } from "vue-router";
import type VueRouter from "vue-router";

export interface BreadcrumbLink {
  name: string;
  to?: string;
}
export type NavLink = {
  to: string;
  isExternal?: boolean;
  name: string;
  childrens?: NavLink[];
  icon?: Component;
  id?: string;
};

export type $t = typeof i18next.t;
export type $eventBus = Emitter<Events>;
export type $cropText = typeof cropText;
export type $formatBytes = typeof formatBytes;
export type $formatTimeago = typeof formatTimeago;
export type $formatDatetime = typeof formatDatetime;
export type $formatDate = typeof formatDate;
export type $formatRecurringPaymentCycle = typeof formatRecurringPaymentCycle;

declare module "vue" {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t;
    $eventBus: Emitter<Events>;
    $cropText: typeof cropText;
    $formatBytes: typeof formatBytes;
    $formatTimeago: typeof formatTimeago;
    $formatDatetime: typeof formatDatetime;
    $formatDate: typeof formatDate;
    $formatRecurringPaymentCycle: typeof formatRecurringPaymentCycle;
    $formatNumber: (value: number) => string;
    $router: VueRouter;
    $route: Route;
  }
  export interface GlobalComponents {
    ClientOnly: typeof ClientOnly;
  }
}

declare module "@vue/runtime-core" {
  export interface ComponentCustomProperties {
    $t: typeof i18next.t;
    $eventBus: Emitter<Events>;
    $cropText: typeof cropText;
    $formatBytes: typeof formatBytes;
    $formatTimeago: typeof formatTimeago;
    $formatDatetime: typeof formatDatetime;
    $formatDate: typeof formatDate;
    $formatRecurringPaymentCycle: typeof formatRecurringPaymentCycle;
    $formatNumber: (value: number) => string;
    $router: VueRouter;
    $route: Route;
  }
  export interface GlobalComponents {
    ClientOnly: typeof ClientOnly;
  }
}
