<script setup lang="ts">
import type { WatchStopHandle } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { APIPaging } from '../../composables/rest'
import { getURL, hasFW } from '@fy-/fws-js'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { useServerHead } from '@unhead/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventBus } from '../../composables/event-bus'
import { useServerRouter } from '../../stores/serverRouter'

const props = withDefaults(
  defineProps<{
    items: APIPaging
    id: string
    hash?: string
    showLegend?: boolean
  }>(),
  {
    showLegend: true,
    hash: '',
  },
)

const route = useRoute()
const eventBus = useEventBus()
const history = useServerRouter()

function isNewPage(page: number) {
  return (
    page >= 1 && page <= props.items.page_max && page !== props.items.page_no
  )
}

const pageWatcher = ref<WatchStopHandle>()

function next() {
  const page = props.items.page_no + 1

  if (!isNewPage(page)) return
  const newQuery = { ...route.query }
  newQuery.page = page.toString()
  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash !== '' ? `#${props.hash}` : undefined,
  })
}

function prev() {
  const page = props.items.page_no - 1
  if (!isNewPage(page)) return
  const newQuery = { ...route.query }
  newQuery.page = page.toString()
  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash !== '' ? `#${props.hash}` : undefined,
  })
}

function page(page: number): RouteLocationRaw {
  const newQuery = { ...route.query }
  newQuery.page = page.toString()
  return {
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash !== '' ? `#${props.hash}` : undefined,
  }
}
const isMounted = ref(false)
pageWatcher.value = watch(
  () => route.query.page,
  (v, oldValue) => {
    if (v === oldValue || !isMounted.value) return
    eventBus.emit(`${props.id}GoToPage`, v || 1)
  },
)

// Compute pagination links for useHead
const paginationLinks = computed(() => {
  const result: any[] = []
  const page_max = Number(props.items.page_max)

  let next
  let prev

  if (hasFW()) {
    const url = getURL()
    if (url) {
      // Parse the canonical URL to get the base URL and current query parameters
      const canonicalUrl = new URL(url.Canonical)

      const baseUrl = `${url.Scheme}://${url.Host}${url.Path}`
      const currentQuery: Record<string, string> = {}
      canonicalUrl.searchParams.forEach((value, key) => {
        currentQuery[key] = value
      })
      // Remove the existing 'page' parameter to avoid duplicates
      const page = Number(currentQuery.page)

      delete currentQuery.page

      const hashPart = props.hash !== '' ? `#${props.hash}` : ''

      if (page + 1 <= page_max) {
        const nextQuery = { ...currentQuery, page: (page + 1).toString() }
        const nextQueryString = new URLSearchParams(nextQuery).toString()
        next = `${baseUrl}?${nextQueryString}${hashPart}`
      }

      if (page - 1 >= 1) {
        const prevQuery = { ...currentQuery, page: (page - 1).toString() }
        const prevQueryString = new URLSearchParams(prevQuery).toString()
        prev = `${baseUrl}?${prevQueryString}${hashPart}`
      }
    }
  }

  if (next) {
    result.push({
      rel: 'next',
      href: next,
      key: `paging-next${props.id}`,
      hid: `paging-next${props.id}`,
      id: `paging-next${props.id}`,
    })
  }
  if (prev) {
    result.push({
      rel: 'prev',
      href: prev,
      key: `paging-prev${props.id}`,
      hid: `paging-prev${props.id}`,
      id: `paging-prev${props.id}`,
    })
  }

  return result
})

// Use useHead outside of any reactive context to ensure it runs during SSR
useServerHead({
  link: paginationLinks.value,
})

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <div
    v-if="items && items.page_max > 1 && items.page_no"
    :id="`pagination-${id}`"
    class="flex items-center justify-center"
  >
    <div class="paging-container">
      <nav aria-label="Pagination" :aria-describedby="showLegend ? `pagination-info-${id}` : undefined">
        <ul class="flex items-center gap-1 h-8 text-xs md:text-sm" role="list">
          <li v-if="items.page_no >= 2">
            <button
              type="button"
              class="flex items-center justify-center w-6 md:w-8 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              aria-label="Previous page"
              @click="prev()"
            >
              <span class="sr-only">{{ $t("previous_paging") }}</span>
              <ChevronLeftIcon class="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
            </button>
          </li>
          <li v-if="items.page_no - 1 > 1">
            <router-link
              class="flex items-center justify-center px-1.5 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              :to="page(1)"
              aria-label="Go to page 1"
            >
              1
            </router-link>
          </li>
          <li v-if="items.page_no - 1 > 2" aria-hidden="true">
            <div
              class="flex items-center justify-center w-5 md:w-6 h-7 md:h-8 text-fv-neutral-500 dark:text-fv-neutral-400"
            >
              <span class="text-[10px] md:text-xs font-medium">•••</span>
            </div>
          </li>
          <li
            v-if="items.page_no - 1 >= 1"
            :key="`page-${items.page_no - 1}`"
          >
            <router-link
              class="flex items-center justify-center px-1.5 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              :to="page(items.page_no - 1)"
              :aria-label="`Go to page ${items.page_no - 1}`"
            >
              {{ items.page_no - 1 }}
            </router-link>
          </li>
          <li>
            <div
              aria-current="page"
              class="flex items-center justify-center px-1.5 h-7 md:h-8 text-white rounded-md shadow-sm bg-primary-600 font-medium dark:bg-primary-500 transition-all"
              :aria-label="`Current page, page ${items.page_no}`"
            >
              {{ items.page_no }}
            </div>
          </li>
          <li
            v-if="items.page_no + 1 <= items.page_max"
            :key="`page-x-${items.page_no + 1}`"
          >
            <router-link
              class="flex items-center justify-center px-1.5 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              :to="page(items.page_no + 1)"
              :aria-label="`Go to page ${items.page_no + 1}`"
            >
              {{ items.page_no + 1 }}
            </router-link>
          </li>
          <li v-if="items.page_no + 1 < items.page_max - 1" aria-hidden="true">
            <div
              class="flex items-center justify-center w-5 md:w-6 h-7 md:h-8 text-fv-neutral-500 dark:text-fv-neutral-400"
            >
              <span class="text-[10px] md:text-xs font-medium">•••</span>
            </div>
          </li>
          <li v-if="items.page_no + 1 < items.page_max">
            <router-link
              class="flex items-center justify-center px-1.5 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              :to="page(items.page_max)"
              :aria-label="`Go to page ${items.page_max}`"
            >
              {{ items.page_max }}
            </router-link>
          </li>
          <li v-if="items.page_no < items.page_max">
            <button
              type="button"
              class="flex items-center justify-center w-6 md:w-8 h-7 md:h-8 text-fv-neutral-700 bg-white/80 rounded-md shadow-sm hover:bg-fv-neutral-100 hover:text-primary-600 focus:ring-2 focus:ring-primary-400/40 focus:outline-none dark:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/70 dark:hover:text-white dark:focus:ring-primary-500/40 transition-all"
              aria-label="Next page"
              @click="next()"
            >
              <span class="sr-only">{{ $t("next_paging") }}</span>
              <ChevronRightIcon class="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </nav>
      <p
        v-if="showLegend"
        :id="`pagination-info-${id}`"
        class="text-[10px] md:text-xs text-fv-neutral-500 dark:text-fv-neutral-400 pt-1 md:pt-1.5 text-center"
      >
        {{
          $t("global_paging", {
            start: items.results_per_page * (items.page_no - 1) + 1,
            end: Math.min(items.results_per_page * items.page_no, items.count),
            total: items.count >= 10000 ? $t("paging_a_lot_of") : items.count,
          })
        }}
      </p>
    </div>
  </div>
</template>
