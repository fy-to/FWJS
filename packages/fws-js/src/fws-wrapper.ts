import type { IFWS, IFWSUrl, Realm } from '@fy-/fws-types'

declare const FW: IFWS | undefined;

export const hasFW = (): boolean =>
    (typeof FW !== "undefined");

export const getPrefix = (): string => 
    FW?.Prefix ?? "";

export const getRealm = (): Realm | {} => 
    FW?.Realm ?? {};

export const getLocale = (): string =>
    FW?.Locale ?? "";

export const getPath = (): string =>
    FW?.Path ?? window.location.pathname;

export const getHostname = (): string =>
    FW?.Hostname ?? window.location.hostname;

export const getURL = (): IFWSUrl =>
    FW?.URL ?? {Path: window.location.pathname, Full: window.location.href, Host: window.location.host, Query: window.location.search, Scheme: window.location.protocol};

export const getInitialState = (): any =>
    FW?.Initial ?? {};

export const getMode = (): "client"|"ssr" =>
    FW?.Mode ?? "client";

export const getUUID = (): string =>
    FW?.UUID ?? "";

export const getLocales = (): string[] =>
    FW?.Locales ?? [];

export const getCookies = (): {[key: string]: string} =>
    FW?.Cookies ?? {};

export const getCookiesString = (): string =>
    Object.entries(getCookies())
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .join("; ");