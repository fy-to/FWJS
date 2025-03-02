import type { I18nBackend } from '@fy-/fws-js'
import type { TFunction } from 'i18next'
import i18next from 'i18next'
import { inject } from 'vue'

export type I18nextTranslate = typeof i18next.t

export function useTranslation() {
  const translate = inject<TFunction>('fwsVueTranslate')
  if (!translate) throw new Error('Did you apply app.use(fwsVue)?')

  return translate
}

export function i18nextPromise(
  backend: typeof I18nBackend,
  locale: string = 'en-US',
  debug: boolean = false,
  ns: string = 'translation',
) {
  return i18next.use(backend).init({
    ns: [ns],
    defaultNS: ns,
    debug,
    lng: locale,
    load: 'currentOnly',
    initImmediate: false,
  })
}
