import type { Ref } from 'vue'
// @ts-nocheck
import { getLocale, getPrefix, getUrl } from '@karpeleslab/klbfw'
import { useHead, useSeoMeta } from '@unhead/vue'
import { useRoute } from 'vue-router'

export interface LazyHead {
  name?: string
  title?: string
  image?: string
  imageType?: string
  imageWidth?: string
  imageHeight?: string
  description?: string
  published?: string
  modified?: string
  keywords?: string
  type?: 'blog' | 'search' | 'article' | 'website'
  searchAction?: string
  next?: string
  prev?: string
  locale?: string
  robots?: string
  url?: string
  canonical?: string
  isAdult?: boolean
  alternateLocales?: string[]
  twitterCreator?: string
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function useSeo(seoData: Ref<LazyHead>, initial: boolean = false) {
  const currentLocale = getLocale()
  // const url = getUrl()

  useHead({
    meta: () => {
      const metas: any[] = []
      if (seoData.value.isAdult) {
        metas.push({
          name: 'rating',
          content: 'RTA-5042-1996-1400-1577-RTA',
          key: 'rating',
        })
      }

      return metas
    },
    link: () => {
      const links: any[] = []

      /*
      const page
        = route.query.page && Number.parseInt(route.query.page.toString()) > 1
          ? `?page=${route.query.page}`
          : ''

      links.push({
        rel: 'canonical',
        href: `${url.Scheme}://${url.Host}${getUrl().Path}${page}`,
      })
      */

      seoData.value.alternateLocales?.forEach((locale) => {
        if (locale !== currentLocale) {
          links.push({
            rel: 'alternate',
            hreflang: locale,
            href: `${getUrl().scheme}://${
              getUrl().host
            }/l/${locale}${getUrl().path.replace(getPrefix(), '')}`,
            key: `alternate-${locale}`,
          })
        }
      })

      /*
      if (seoData.value.image) {
        links.push({
          rel: 'preload',
          href: seoData.value.image,
          as: 'image',
          fetchpriority: 'high',
        })
      }
      */

      return links
    },
  })

  useSeoMeta({
    ogUrl: () => `${getUrl().Canonical}`,
    ogLocale: () => {
      if (currentLocale) {
        return currentLocale.replace('-', '_')
      }
    },
    robots:
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    title: () => seoData.value.title || '',
    ogTitle: () => seoData.value.title,
    ogDescription: () => seoData.value.description,
    twitterCard: 'summary_large_image',
    ogSiteName: () => seoData.value.name,
    twitterTitle: () => seoData.value.title,
    twitterDescription: () => seoData.value.description,
    ogImageAlt: () => {
      if (seoData.value.image) {
        return seoData.value.title
      }
      return undefined
    },
    // @ts-expect-error: Type 'string' is not assignable to type 'undefined'.
    ogType: () => (seoData.value.type ? seoData.value.type : 'website'),
    twitterCreator: () => seoData.value.twitterCreator,
    twitterSite: () => seoData.value.twitterCreator,
    twitterImageAlt: () => {
      if (seoData.value.image) {
        return seoData.value.title
      }
      return undefined
    },
    description: () => seoData.value.description,
    keywords: () => seoData.value.keywords,
    articlePublishedTime: () => seoData.value.published,
    articleModifiedTime: () => seoData.value.modified,
    ogImageSecureUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes('?vars=')) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              '?vars=',
              `.${seoData.value.imageType.replace('image/', '')}?vars=`,
            )
          }
          else {
            return seoData.value.image.replace('?vars=', '.png?vars=')
          }
        }
        return seoData.value.image
      }
    },
    ogImageUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes('?vars=')) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              '?vars=',
              `.${seoData.value.imageType.replace('image/', '')}?vars=`,
            )
          }
          else {
            return seoData.value.image.replace('?vars=', '.png?vars=')
          }
        }
        return seoData.value.image
      }
    },
    ogImageType: () => {
      if (seoData.value.imageType) {
        const type = seoData.value.imageType.includes('image/')
          ? seoData.value.imageType
          : `image/${seoData.value.imageType}`
        if (type === 'image/jpeg' || type === 'image/gif' || type === 'image/png') {
          return type
        }
        return 'image/png'
      }
      return undefined
    },
    twitterImageUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes('?vars=')) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              '?vars=',
              `.${seoData.value.imageType.replace('image/', '')}?vars=`,
            )
          }
          else {
            return seoData.value.image.replace('?vars=', '.png?vars=')
          }
        }
        return seoData.value.image
      }
    },
    twitterImageType() {
      if (seoData.value.imageType) {
        const type = seoData.value.imageType.includes('image/')
          ? seoData.value.imageType
          : `image/${seoData.value.imageType}`
        if (type === 'image/jpeg' || type === 'image/gif' || type === 'image/png') {
          return type
        }
        return 'image/png'
      }
      return undefined
    },
  })
}
