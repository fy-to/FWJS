<script setup lang="ts">
import type { WatchStopHandle } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { APIPaging } from '../../composables/rest'
import { getURL, hasFW } from '@fy-/fws-js'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { useServerHead } from '@unhead/vue'
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
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

// Using shallowRef for non-reactive values
const isMounted = shallowRef(false)
const pageWatcher = shallowRef<WatchStopHandle>()

// Jump to page functionality
const jumpPageValue = ref('')
const showJumpInput = ref(false)

// Compute input width based on max page digits
const inputWidthClass = computed(() => {
  const digits = props.items.page_max.toString().length
  if (digits >= 3) {
    return 'w-12 md:w-14'
  }
  return 'w-8 md:w-10'
})

// Memoize the hash string to avoid repeated computation
const hashString = computed(() => props.hash !== '' ? `#${props.hash}` : undefined)

// Check if a page is valid to navigate to
function isNewPage(page: number) {
  return (
    page >= 1 && page <= props.items.page_max && page !== props.items.page_no
  )
}

// Debounced navigation functions to prevent rapid clicks
const next = useDebounceFn(() => {
  const page = props.items.page_no + 1

  if (!isNewPage(page)) return

  const newQuery = { ...route.query }
  newQuery.page = page.toString()

  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: hashString.value,
  })
}, 300)

const prev = useDebounceFn(() => {
  const page = props.items.page_no - 1

  if (!isNewPage(page)) return

  const newQuery = { ...route.query }
  newQuery.page = page.toString()

  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: hashString.value,
  })
}, 300)

// Jump to page functionality
const jumpToPage = useDebounceFn(() => {
  const targetPage = Number.parseInt(jumpPageValue.value)

  if (Number.isNaN(targetPage) || !isNewPage(targetPage)) {
    jumpPageValue.value = ''
    return
  }

  const newQuery = { ...route.query }
  newQuery.page = targetPage.toString()

  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: hashString.value,
  })

  jumpPageValue.value = ''
  showJumpInput.value = false
}, 300)

function toggleJumpInput() {
  showJumpInput.value = !showJumpInput.value
  if (!showJumpInput.value) {
    jumpPageValue.value = ''
  }
  else {
    // Focus the input after Vue updates the DOM
    nextTick(() => {
      const input = document.querySelector('.pagination-jump-input') as HTMLInputElement
      if (input) {
        input.focus()
      }
    })
  }
}

function handleJumpInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    jumpToPage()
  }
  else if (event.key === 'Escape') {
    showJumpInput.value = false
    jumpPageValue.value = ''
  }
}

// Extract route generation to a reusable function to reduce duplicated code
function page(page: number): RouteLocationRaw {
  if (!isNewPage(page)) {
    // Return current route if the page is not valid
    return {
      path: history.currentRoute.path,
      query: route.query,
      hash: hashString.value,
    }
  }

  const newQuery = { ...route.query }
  newQuery.page = page.toString()

  return {
    path: history.currentRoute.path,
    query: newQuery,
    hash: hashString.value,
  }
}

// Watch for route changes to trigger page change events
pageWatcher.value = watch(
  () => route.query.page,
  (v, oldValue) => {
    // Skip if component is not mounted or value hasn't changed
    if (v === oldValue || !isMounted.value) return

    // Emit page change event with fallback to page 1
    eventBus.emit(`${props.id}GoToPage`, v || 1)
  },
)

// Compute pagination links for SEO head tags with performance optimizations
const paginationLinks = computed(() => {
  // Early exit if basic conditions aren't met
  if (!hasFW() || props.items.page_max <= 1) {
    return []
  }

  const result: any[] = []
  const page_max = Number(props.items.page_max)
  const url = getURL()

  if (!url) return result

  try {
    // Parse the canonical URL once
    const canonicalUrl = new URL(url.Canonical)
    const baseUrl = `${url.Scheme}://${url.Host}${url.Path}`

    // Build query params object
    const currentQuery: Record<string, string> = {}
    canonicalUrl.searchParams.forEach((value, key) => {
      currentQuery[key] = value
    })

    // Get current page and create hash part once
    const page = Number(currentQuery.page) || 1
    const hashPart = props.hash !== '' ? `#${props.hash}` : ''

    // Remove page from query params to avoid duplicates
    delete currentQuery.page

    // Add next link if applicable
    if (page + 1 <= page_max) {
      const nextQuery = { ...currentQuery, page: (page + 1).toString() }
      const nextQueryString = new URLSearchParams(nextQuery).toString()
      result.push({
        rel: 'next',
        href: `${baseUrl}?${nextQueryString}${hashPart}`,
        key: `paging-next${props.id}`,
        hid: `paging-next${props.id}`,
        id: `paging-next${props.id}`,
      })
    }

    // Add prev link if applicable
    if (page - 1 >= 1) {
      const prevQuery = { ...currentQuery, page: (page - 1).toString() }
      const prevQueryString = new URLSearchParams(prevQuery).toString()
      result.push({
        rel: 'prev',
        href: `${baseUrl}?${prevQueryString}${hashPart}`,
        key: `paging-prev${props.id}`,
        hid: `paging-prev${props.id}`,
        id: `paging-prev${props.id}`,
      })
    }
  }
  catch (e) {
    // Silently fail if URL parsing fails
    console.error('Error generating pagination links:', e)
  }

  return result
})

// Set head tags using useServerHead
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
          <li v-if="items.page_no - 1 > 2">
            <div
              v-if="!showJumpInput"
              class="flex items-center justify-center w-5 md:w-6 h-7 md:h-8 text-fv-neutral-500 hover:text-primary-600 dark:text-fv-neutral-400 dark:hover:text-white cursor-pointer transition-all"
              title="Jump to page"
              @click="toggleJumpInput"
            >
              <span class="text-[10px] md:text-xs font-medium">•••</span>
            </div>
            <input
              v-else
              :id="`jump-input-${id}`"
              v-model="jumpPageValue"
              type="number"
              :min="1"
              :max="items.page_max"
              :class="`pagination-jump-input ${inputWidthClass}`"
              placeholder="#"
              @keydown="handleJumpInputKeydown"
              @blur="showJumpInput = false; jumpPageValue = ''"
            >
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
          <li v-if="items.page_no + 1 < items.page_max - 1">
            <div
              v-if="!showJumpInput"
              class="flex items-center justify-center w-5 md:w-6 h-7 md:h-8 text-fv-neutral-500 hover:text-primary-600 dark:text-fv-neutral-400 dark:hover:text-white cursor-pointer transition-all"
              title="Jump to page"
              @click="toggleJumpInput"
            >
              <span class="text-[10px] md:text-xs font-medium">•••</span>
            </div>
            <input
              v-else
              :id="`jump-input-${id}`"
              v-model="jumpPageValue"
              type="number"
              :min="1"
              :max="items.page_max"
              :class="`pagination-jump-input ${inputWidthClass}`"
              placeholder="#"
              @keydown="handleJumpInputKeydown"
              @blur="showJumpInput = false; jumpPageValue = ''"
            >
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
          <li v-if="items.page_max > 5 && (items.page_no - 1 <= 2 && items.page_no + 1 >= items.page_max - 1)">
            <div
              v-if="!showJumpInput"
              class="flex items-center justify-center w-6 md:w-8 h-7 md:h-8 text-fv-neutral-500 hover:text-primary-600 dark:text-fv-neutral-400 dark:hover:text-white cursor-pointer transition-all"
              title="Jump to page"
              @click="toggleJumpInput"
            >
              <span class="text-[10px] md:text-xs font-bold">⋯</span>
            </div>
            <input
              v-else
              :id="`jump-input-${id}`"
              v-model="jumpPageValue"
              type="number"
              :min="1"
              :max="items.page_max"
              :class="`pagination-jump-input ${inputWidthClass}`"
              placeholder="#"
              @keydown="handleJumpInputKeydown"
              @blur="showJumpInput = false; jumpPageValue = ''"
            >
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
