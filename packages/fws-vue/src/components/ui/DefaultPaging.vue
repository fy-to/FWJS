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
    class="flex flex-col items-center justify-center"
  >
    <div class="paging-container w-full">
      <nav aria-label="Pagination" class="mb-2 flex justify-center">
        <ul class="pagination-list">
          <!-- Previous Button -->
          <li v-if="items.page_no >= 2" class="pagination-item md:block">
            <button
              type="button"
              class="pagination-button pagination-nav-button"
              :aria-label="$t('previous_paging')"
              title="Previous page"
              @click="prev()"
            >
              <ChevronLeftIcon class="w-5 h-5" aria-hidden="true" />
              <span class="sr-only">{{ $t("previous_paging") }}</span>
            </button>
          </li>
          <li v-else class="pagination-item invisible md:hidden">
            <div class="pagination-placeholder">
              <ChevronLeftIcon class="w-5 h-5 invisible" aria-hidden="true" />
            </div>
          </li>

          <!-- First Page -->
          <li v-if="items.page_no - 2 > 1" class="pagination-item hidden md:block">
            <router-link
              class="pagination-link"
              :to="page(1)"
              aria-label="Go to page 1"
            >
              1
            </router-link>
          </li>

          <!-- Ellipsis after first page -->
          <li v-if="items.page_no - 2 > 2" class="pagination-item hidden md:block" aria-hidden="true">
            <div class="pagination-ellipsis">
              <span>•••</span>
            </div>
          </li>

          <!-- Pages before current page -->
          <template v-for="i in 2">
            <li
              v-if="items.page_no - (3 - i) >= 1"
              :key="`page-${items.page_no - (3 - i)}`"
              class="pagination-item hidden sm:block"
            >
              <router-link
                class="pagination-link"
                :to="page(items.page_no - (3 - i))"
                :aria-label="`Go to page ${items.page_no - (3 - i)}`"
              >
                {{ items.page_no - (3 - i) }}
              </router-link>
            </li>
          </template>

          <!-- Current Page -->
          <li class="pagination-item">
            <div
              aria-current="page"
              class="pagination-current"
              :aria-label="`Current page, Page ${items.page_no}`"
            >
              {{ items.page_no }}
            </div>
          </li>

          <!-- Pages after current page -->
          <template v-for="i in 2">
            <li
              v-if="items.page_no + i <= items.page_max"
              :key="`page-x-${items.page_no + i}`"
              class="pagination-item hidden sm:block"
            >
              <router-link
                class="pagination-link"
                :to="page(items.page_no + i)"
                :aria-label="`Go to page ${items.page_no + i}`"
              >
                {{ items.page_no + i }}
              </router-link>
            </li>
          </template>

          <!-- Ellipsis before last page -->
          <li v-if="items.page_no + 2 < items.page_max - 1" class="pagination-item hidden md:block" aria-hidden="true">
            <div class="pagination-ellipsis">
              <span>•••</span>
            </div>
          </li>

          <!-- Last Page -->
          <li v-if="items.page_no + 2 < items.page_max" class="pagination-item hidden md:block">
            <router-link
              class="pagination-link"
              :to="page(items.page_max)"
              :aria-label="`Go to page ${items.page_max}`"
            >
              {{ items.page_max }}
            </router-link>
          </li>

          <!-- Next Button -->
          <li v-if="items.page_no < items.page_max" class="pagination-item md:block">
            <button
              type="button"
              class="pagination-button pagination-nav-button"
              :aria-label="$t('next_paging')"
              title="Next page"
              @click="next()"
            >
              <ChevronRightIcon class="w-5 h-5" aria-hidden="true" />
              <span class="sr-only">{{ $t("next_paging") }}</span>
            </button>
          </li>
          <li v-else class="pagination-item invisible md:hidden">
            <div class="pagination-placeholder">
              <ChevronRightIcon class="w-5 h-5 invisible" aria-hidden="true" />
            </div>
          </li>
        </ul>
      </nav>

      <!-- Mobile page indication (x of y) -->
      <div class="sm:hidden text-center mb-2">
        <span class="text-sm font-medium text-fv-neutral-700 dark:text-fv-neutral-200">
          Page {{ items.page_no }} of {{ items.page_max }}
        </span>
      </div>

      <!-- Results summary -->
      <p
        v-if="showLegend"
        class="text-xs text-center text-fv-neutral-700 dark:text-fv-neutral-400"
        aria-live="polite"
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

<style scoped>
.pagination-list {
  @apply inline-flex items-center justify-center gap-1 shadow-sm rounded-lg;
}

.pagination-item {
  @apply flex items-center justify-center;
}

.pagination-link,
.pagination-button,
.pagination-current,
.pagination-ellipsis,
.pagination-placeholder {
  @apply flex items-center justify-center;
  min-width: 2.25rem;
  height: 2.25rem;
}

.pagination-link {
  @apply px-3 py-2 rounded-md text-sm font-medium bg-white border border-fv-neutral-200
    text-fv-neutral-700 hover:bg-fv-neutral-50 hover:text-fv-primary-600
    focus:z-10 focus:outline-none focus:ring-2 focus:ring-fv-primary-500 focus:ring-offset-1
    transition-colors duration-200
    dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-200
    dark:hover:bg-fv-neutral-700 dark:hover:text-white
    dark:focus:ring-fv-primary-500;
}

.pagination-current {
  @apply px-3 py-2 rounded-md text-sm font-bold
    bg-fv-primary-100 text-fv-primary-700 border border-fv-primary-300
    dark:bg-fv-primary-900 dark:text-fv-primary-100 dark:border-fv-primary-700;
}

.pagination-nav-button {
  @apply p-2 rounded-md text-fv-neutral-600 bg-white border border-fv-neutral-200
    hover:bg-fv-neutral-50 hover:text-fv-primary-600
    focus:z-10 focus:outline-none focus:ring-2 focus:ring-fv-primary-500 focus:ring-offset-1
    transition-colors duration-200
    dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-300
    dark:hover:bg-fv-neutral-700 dark:hover:text-white;
}

.pagination-ellipsis {
  @apply px-2 py-1 text-fv-neutral-500 dark:text-fv-neutral-400;
}

@media (max-width: 640px) {
  .pagination-list {
    @apply gap-2;
  }

  .pagination-link,
  .pagination-button,
  .pagination-current {
    min-width: 2rem;
    height: 2rem;
  }
}
</style>
