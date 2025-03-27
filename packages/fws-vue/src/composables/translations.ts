import type { I18nBackend } from '@fy-/fws-js'
import type { TFunction } from 'i18next'
import i18next from 'i18next'
import { inject } from 'vue'

export type I18nextTranslate = typeof i18next.t

// Cached translation service instance
let cachedTranslation: TFunction | null = null

export function useTranslation() {
  // Return cached instance if available
  if (cachedTranslation) return cachedTranslation

  const translate = inject<TFunction>('fwsVueTranslate')
  if (!translate) throw new Error('Did you apply app.use(fwsVue)?')

  // Cache the translation service instance
  cachedTranslation = translate
  return translate
}

// Default configuration for i18next to avoid object recreation
const defaultI18nextConfig = {
  ns: ['translation'],
  defaultNS: 'translation',
  debug: false,
  load: 'currentOnly' as const,
  initImmediate: false,
}

export function i18nextPromise(
  backend: typeof I18nBackend,
  locale: string = 'en-US',
  debug: boolean = false,
  ns: string = 'translation',
) {
  return i18next.use(backend).init({
    ...defaultI18nextConfig,
    ns: [ns],
    defaultNS: ns,
    debug,
    lng: locale,
  })
}
