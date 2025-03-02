<script setup lang="ts">
import type {
  WatchStopHandle,
} from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { APIPaging } from '../../composables/rest'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { getUrl } from '@karpeleslab/klbfw'
import { useServerHead } from '@unhead/vue'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
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

  const url = getUrl()
  if (url) {
    // Parse the canonical URL to get the base URL and current query parameters
    const canonicalUrl = new URL(url.full)

    const baseUrl = `${url.scheme}://${url.host}${url.path}`
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
    class="flex items-center justify-center"
  >
    <div class="paging-container">
      <nav aria-label="Pagination">
        <ul class="flex items-center -space-x-px h-8 text-sm">
          <li v-if="items.page_no >= 2">
            <button
              type="button"
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
              @click="prev()"
            >
              <span class="sr-only">{{ $t("previous_paging") }}</span>
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
          </li>
          <li v-if="items.page_no - 2 > 1">
            <router-link
              class="flex items-center justify-center px-3 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
              :to="page(1)"
            >
              1
            </router-link>
          </li>
          <li v-if="items.page_no - 2 > 2">
            <div
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400"
            >
              ...
            </div>
          </li>
          <template v-for="i in 2">
            <li
              v-if="items.page_no - (3 - i) >= 1"
              :key="`page-${items.page_no - (3 - i)}`"
            >
              <router-link
                class="flex items-center justify-center px-3 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
                :to="page(items.page_no - (3 - i))"
              >
                {{ items.page_no - (3 - i) }}
              </router-link>
            </li>
          </template>
          <li>
            <div
              aria-current="page"
              class="z-10 flex items-center justify-center px-3 h-8 leading-tight text-primary-600 border border-primary-300 bg-primary-50 dark:border-fv-neutral-700 dark:bg-fv-neutral-700 dark:text-white"
            >
              {{ items.page_no }}
            </div>
          </li>
          <template v-for="i in 2">
            <li
              v-if="items.page_no + i <= items.page_max"
              :key="`page-x-${items.page_no + i}`"
            >
              <router-link
                class="flex items-center justify-center px-3 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
                :to="page(items.page_no + i)"
              >
                {{ items.page_no + i }}
              </router-link>
            </li>
          </template>
          <li v-if="items.page_no + 2 < items.page_max - 1">
            <div
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400"
            >
              ...
            </div>
          </li>
          <li v-if="items.page_no + 2 < items.page_max">
            <router-link
              class="flex items-center justify-center px-3 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
              :to="page(items.page_max)"
            >
              {{ items.page_max }}
            </router-link>
          </li>
          <li v-if="items.page_no < items.page_max">
            <button
              type="button"
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
              @click="next()"
            >
              <span class="sr-only">{{ $t("next_paging") }}</span>
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
      <p
        v-if="showLegend"
        class="text-xs text-fv-neutral-700 dark:text-fv-neutral-400 pt-0.5"
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
