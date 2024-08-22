import type { Realm } from './realm'

export interface IFWSUrl {
    Full: string,
    Path: string,
    Host: string,
    Query: string,
    Scheme: string,
    Canonical: string
}

export interface IFWS {
    Locale: string,
    Realm: Realm,
    Locales: string[],
    URL : IFWSUrl,
    Cookies: {
        [key: string]: string
    }
    Hostname: string,
    Initial: any,
    Mode: "client"|"ssr",
    Path: string,
    Prefix: string,
    UUID: string,
}