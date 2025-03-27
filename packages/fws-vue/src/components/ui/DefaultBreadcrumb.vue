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
const breadcrumbsSchemaFormat = computed(() => props.nav.map((item, index) => {
  if (!item.to) {
    return {
      'position': index + 1,
      'name': item.name,
      '@type': 'ListItem',
    }
  }

  const fullUrl = `${baseUrl.value.host}${item.to}`.replace(/\/\//g, '/')
  return {
    'position': index + 1,
    'name': item.name,
    'item': `${baseUrl.value.scheme}://${fullUrl}`,
    '@type': 'ListItem',
  }
}))

// Cache breadcrumb ID to avoid string operations on every render
const breadcrumbId = computed(() => {
  if (!props.nav.length) return ''
  const chain = props.nav.map(item => item.name).join(' > ')
  return stringHash(chain)
})

// Only run schema.org setup if we have breadcrumbs
if (props.nav && props.nav.length) {
  useSchemaOrg([
    defineBreadcrumb({
      '@id': computed(() => `#${breadcrumbId.value}`),
      'itemListElement': breadcrumbsSchemaFormat,
    }),
  ])
}
</script>

<template>
  <ol class="inline-flex items-center flex-wrap">
    <template v-for="(item, index) in nav" :key="`bc_${index.toString()}`">
      <li class="inline-flex items-center">
        <ChevronRightIcon
          v-if="index !== 0"
          :class="
            index === 0
              ? 'w-4 h-4 mr-2 inline-block'
              : 'w-5 h-5 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
          "
        />

        <router-link
          v-if="item.to"
          :to="item.to"
          :class="
            index === 0
              ? 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white'
              : 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white'
          "
        >
          <HomeIcon
            v-if="showHome && index === 0"
            :class="
              index === 0
                ? 'w-4 h-4 mr-2 inline-block'
                : 'w-4 h-4 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
            "
          />
          <span>{{ item.name }}</span>
        </router-link>
        <span
          v-else
          class="text-xs font-medium text-fv-neutral-500 dark:text-fv-neutral-200"
        >
          {{ item.name }}
        </span>
      </li>
    </template>
  </ol>
</template>
