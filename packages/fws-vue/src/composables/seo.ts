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

// Cache for processed image URLs with size limit
const processedImageUrlCache = new Map<string, string>()
const MAX_IMAGE_URL_CACHE_SIZE = 200

// Helper function to process image URLs with caching
function processImageUrl(image: string | undefined, imageType: string | undefined): string | undefined {
  if (!image) return undefined

  // Create cache key
  const cacheKey = `${image}|${imageType || ''}`
  const cached = processedImageUrlCache.get(cacheKey)
  if (cached) return cached

  let result: string
  if (image.includes('?vars=')) {
    const extension = imageType ? imageType.replace('image/', '') : 'png'
    result = image.replace('?vars=', `.${extension}?vars=`)
  }
  else {
    result = image
  }

  // Implement LRU-like cache eviction
  if (processedImageUrlCache.size >= MAX_IMAGE_URL_CACHE_SIZE) {
    const firstKey = processedImageUrlCache.keys().next().value
    if (firstKey !== undefined) {
      processedImageUrlCache.delete(firstKey)
    }
  }

  processedImageUrlCache.set(cacheKey, result)
  return result
}

// Cache normalized image types
const normalizedImageTypeCache = new Map<string | undefined, 'image/jpeg' | 'image/gif' | 'image/png' | null>()

// Helper function to normalize image type with caching
function normalizeImageType(imageType: string | undefined): 'image/jpeg' | 'image/gif' | 'image/png' | null {
  const cached = normalizedImageTypeCache.get(imageType)
  if (cached !== undefined) return cached

  let result: 'image/jpeg' | 'image/gif' | 'image/png' | null

  if (!imageType) {
    result = null
  }
  else {
    const type = imageType.includes('image/') ? imageType : `image/${imageType}`
    if (type === 'image/jpeg' || type === 'image/gif' || type === 'image/png') {
      result = type as 'image/jpeg' | 'image/gif' | 'image/png'
    }
    else {
      result = 'image/png'
    }
  }

  normalizedImageTypeCache.set(imageType, result)
  return result
}

// Precomputed alternate locale URL template - inline for better JIT
function ALTERNATE_LOCALE_TEMPLATE(scheme: string, host: string, locale: string, path: string) {
  return `${scheme}://${host}/l/${locale}${path}`
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
  const imageType = computed(() => {
    const type = normalizeImageType(seoData.value.imageType)
    return type === null ? undefined : type
  })
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

      // Optimize alternate locale generation
      if (seoData.value.alternateLocales?.length) {
        const pathWithoutPrefix = urlBase.value.path.replace(urlBase.value.prefix, '')

        for (const locale of seoData.value.alternateLocales) {
          if (locale !== currentLocale) {
            links.push({
              rel: 'alternate',
              hreflang: locale,
              href: ALTERNATE_LOCALE_TEMPLATE(
                urlBase.value.scheme,
                urlBase.value.host,
                locale,
                pathWithoutPrefix,
              ),
              key: `alternate-${locale}`,
            })
          }
        }
      }

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

  // Create memoized getters for frequently accessed values
  const seoTitle = computed(() => seoData.value.title)
  const seoDescription = computed(() => seoData.value.description)
  const seoType = computed(() => seoData.value.type || 'website')
  const twitterCreator = computed(() => seoData.value.twitterCreator)

  useSeoMeta({
    ogUrl: () => urlBase.value.canonical,
    ogLocale: () => localeForOg.value,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    title: () => seoTitle.value || '',
    ogTitle: () => seoTitle.value,
    ogDescription: () => seoDescription.value,
    twitterCard: 'summary_large_image',
    ogSiteName: () => seoData.value.name,
    twitterTitle: () => seoTitle.value,
    twitterDescription: () => seoDescription.value,
    ogImageAlt: () => imageAlt.value,
    // @ts-expect-error: Type 'string' is not assignable to type 'undefined'.
    ogType: () => seoType.value,
    twitterCreator: () => twitterCreator.value,
    twitterSite: () => twitterCreator.value,
    twitterImageAlt: () => imageAlt.value,
    description: () => seoDescription.value,
    keywords: () => seoData.value.keywords,
    articlePublishedTime: () => seoData.value.published,
    articleModifiedTime: () => seoData.value.modified,
    ogImageSecureUrl: () => imageUrl.value,
    ogImageUrl: () => imageUrl.value,
    ogImageType: () => imageType.value,
    twitterImageUrl: () => imageUrl.value,
    twitterImageType: () => imageType.value,
  })
}
