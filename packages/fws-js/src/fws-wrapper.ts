import type { IFWS, IFWSUrl, Realm } from '@fy-/fws-types'

declare const FW: IFWS | undefined;

export const hasFW = (): boolean =>
    (typeof FW !== "undefined");

export const getPrefix = (): string => (typeof FW !== "undefined") ? FW?.Prefix : "";

export const getRealm = (): Realm | {} => (typeof FW !== "undefined") ? FW?.Realm : {};

export const getLocale = (): string =>
   (typeof FW !== "undefined") ? FW?.Locale : "";

export const getPath = (): string =>
   (typeof FW !== "undefined") ? FW?.Path : window.location.pathname;

export const getHostname = (): string =>
   (typeof FW !== "undefined") ? FW?.Hostname : window.location.hostname;

export const getURL = (): IFWSUrl =>
   (typeof FW !== "undefined") ? FW?.URL : {Path: window.location.pathname, Full: window.location.href, Host: window.location.host, Query: window.location.search, Scheme: window.location.protocol, Canonical: window.location.href};

export const getInitialState = (): any =>
   (typeof FW !== "undefined") ? FW?.Initial : {};

export const getMode = (): "client"|"ssr" =>
   (typeof FW !== "undefined") ? FW?.Mode : "client";

export const getUUID = (): string =>
   (typeof FW !== "undefined") ? FW?.UUID : "";

export const getLocales = (): string[] =>
   (typeof FW !== "undefined") ? FW?.Locales : [];

export const getCookies = (): {[key: string]: string} =>
   (typeof FW !== "undefined") ? FW?.Cookies : {};

export const getCookiesString = (): string =>
    Object.entries(getCookies())
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .join("; ");