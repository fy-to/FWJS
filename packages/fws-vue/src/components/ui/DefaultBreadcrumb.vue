<script lang="ts" setup>
import type { BreadcrumbLink } from '../../types'
import { getURL, stringHash } from '@fy-/fws-js'
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/24/solid'
import { defineBreadcrumb } from '@unhead/schema-org'
import { useSchemaOrg } from '@unhead/schema-org/vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    nav: BreadcrumbLink[]
    showHome: boolean
  }>(),
  {
    nav: () => [],
    showHome: () => true,
  },
)

// Memoize URL computation
const baseUrl = computed(() => {
  const url = getURL()
  return {
    host: url.Host,
    scheme: url.Scheme,
  }
})

// Memoize breadcrumb schema format to avoid recalculation
const breadcrumbsSchemaFormat = computed(() => {
  const navLength = props.nav.length

  return props.nav.map((item, index) => {
    const isLastItem = index === navLength - 1

    // According to Google's guidelines, the last item should not have a URL
    if (!item.to || isLastItem) {
      return {
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
      }
    }

    // Ensure proper URL construction
    let itemUrl = item.to

    // Handle relative URLs
    if (itemUrl.startsWith('/')) {
      itemUrl = `${baseUrl.value.scheme}://${baseUrl.value.host}${itemUrl}`
    }
    else if (!itemUrl.startsWith('http')) {
      // Handle paths without leading slash
      itemUrl = `${baseUrl.value.scheme}://${baseUrl.value.host}/${itemUrl}`
    }

    // Clean up any double slashes (except after protocol)
    itemUrl = itemUrl.replace(/([^:]\/)\/+/g, '$1')

    return {
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': itemUrl,
    }
  })
})

// Cache breadcrumb ID to avoid string operations on every render
const breadcrumbId = computed(() => {
  if (!props.nav.length) return ''
  const chain = props.nav.map(item => item.name).join(' > ')
  return stringHash(chain)
})

// Class strings extracted for reusability and mobile optimization
const linkClasses = 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white transition-colors duration-200'
const textClasses = 'text-xs font-medium text-fv-neutral-500 dark:text-fv-neutral-200'
const chevronClasses = 'w-4 h-4 md:w-5 md:h-5 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
const homeIconClasses = 'w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 inline-block'

// Only run schema.org setup if we have breadcrumbs
if (props.nav && props.nav.length > 0) {
  useSchemaOrg([
    defineBreadcrumb({
      '@id': `#${breadcrumbId.value}`,
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbsSchemaFormat,
    }),
  ])
}
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="inline-flex items-center flex-wrap gap-y-1">
      <template v-for="(item, index) in nav" :key="`bc_${index.toString()}`">
        <li class="inline-flex items-center">
          <ChevronRightIcon
            v-if="index !== 0"
            :class="chevronClasses"
          />

          <router-link
            v-if="item.to && index !== nav.length - 1"
            :to="item.to"
            :class="linkClasses"
            :aria-current="index === nav.length - 1 ? 'page' : undefined"
          >
            <HomeIcon
              v-if="showHome && index === 0"
              :class="homeIconClasses"
            />
            <span>{{ item.name }}</span>
          </router-link>
          <span
            v-else
            :class="textClasses"
            :aria-current="index === nav.length - 1 ? 'page' : undefined"
          >
            {{ item.name }}
          </span>
        </li>
      </template>
    </ol>
  </nav>
</template>
