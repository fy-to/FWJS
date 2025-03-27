import type { Ref } from 'vue'
import { getLocale, getPrefix, getURL } from '@fy-/fws-js'
import { useHead, useSeoMeta } from '@unhead/vue'
import { computed } from 'vue'

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

// Helper function to process image URLs
function processImageUrl(image: string | undefined, imageType: string | undefined): string | undefined {
  if (!image) return undefined

  if (image.includes('?vars=')) {
    if (imageType) {
      return image.replace(
        '?vars=',
        `.${imageType.replace('image/', '')}?vars=`,
      )
    }
    else {
      return image.replace('?vars=', '.png?vars=')
    }
  }
  return image
}

// Helper function to normalize image type
function normalizeImageType(imageType: string | undefined): 'image/jpeg' | 'image/gif' | 'image/png' | false {
  if (!imageType) return false

  const type = imageType.includes('image/') ? imageType : `image/${imageType}`
  if (type === 'image/jpeg' || type === 'image/gif' || type === 'image/png') {
    return type as 'image/jpeg' | 'image/gif' | 'image/png'
  }
  return 'image/png'
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function useSeo(seoData: Ref<LazyHead>, initial: boolean = false) {
  const currentLocale = getLocale()

  // Cache the URL components
  const urlBase = computed(() => ({
    scheme: getURL().Scheme,
    host: getURL().Host,
    path: getURL().Path,
    canonical: getURL().Canonical,
    prefix: getPrefix(),
  }))

  // Memoize common values
  const localeForOg = computed(() => currentLocale?.replace('-', '_'))
  const imageUrl = computed(() => processImageUrl(seoData.value.image, seoData.value.imageType))
  const imageType = computed(() => normalizeImageType(seoData.value.imageType))
  const imageAlt = computed(() => seoData.value.image ? seoData.value.title : undefined)

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
        href: `${url.Scheme}://${url.Host}${getURL().Path}${page}`,
      })
      */

      seoData.value.alternateLocales?.forEach((locale) => {
        if (locale !== currentLocale) {
          links.push({
            rel: 'alternate',
            hreflang: locale,
            href: `${urlBase.value.scheme}://${
              urlBase.value.host
            }/l/${locale}${urlBase.value.path.replace(urlBase.value.prefix, '')}`,
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
    ogUrl: () => urlBase.value.canonical,
    ogLocale: () => localeForOg.value,
    robots:
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    title: () => seoData.value.title || '',
    ogTitle: () => seoData.value.title,
    ogDescription: () => seoData.value.description,
    twitterCard: 'summary_large_image',
    ogSiteName: () => seoData.value.name,
    twitterTitle: () => seoData.value.title,
    twitterDescription: () => seoData.value.description,
    ogImageAlt: () => imageAlt.value,
    // @ts-expect-error: Type 'string' is not assignable to type 'undefined'.
    ogType: () => (seoData.value.type ? seoData.value.type : 'website'),
    twitterCreator: () => seoData.value.twitterCreator,
    twitterSite: () => seoData.value.twitterCreator,
    twitterImageAlt: () => imageAlt.value,
    description: () => seoData.value.description,
    keywords: () => seoData.value.keywords,
    articlePublishedTime: () => seoData.value.published,
    articleModifiedTime: () => seoData.value.modified,
    ogImageSecureUrl: () => imageUrl.value,
    ogImageUrl: () => imageUrl.value,
    ogImageType: () => imageType.value,
    twitterImageUrl: () => imageUrl.value,
    twitterImageType() {
      return imageType.value
    },
  })
}
