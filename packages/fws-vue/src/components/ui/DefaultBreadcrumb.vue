<script lang="ts" setup>
import type { BreadcrumbLink } from '../../types'
import { getURL, stringHash } from '@fy-/fws-js'
import { ChevronRightIcon, HomeIcon } from '@heroicons/vue/24/solid'
import { defineBreadcrumb, useSchemaOrg } from '@unhead/schema-org'

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

const breadcrumbsSchemaFormat = props.nav.map((item, index) => {
  const fullUrl = `${
    getURL().Host
  }${item.to}`.replace(/\/\//g, '/')
  return {
    'position': index + 1,
    'name': item.name,
    'item': item.to
      ? `${getURL().Scheme}://${fullUrl}`
      : undefined,
    '@type': 'ListItem',
  }
})
function getBreadcrumbID() {
  const chain = props.nav.map(item => item.name).join(' > ')
  return stringHash(chain)
}
if (props.nav && props.nav.length) {
  useSchemaOrg([
    defineBreadcrumb({
      '@id': `#${getBreadcrumbID()}`,
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
