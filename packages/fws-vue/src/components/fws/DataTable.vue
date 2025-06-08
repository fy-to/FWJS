<script setup lang="ts">
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
} from '@heroicons/vue/24/solid'
import { useStorage } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import DefaultInput from '../ui/DefaultInput.vue'
import DefaultPaging from '../ui/DefaultPaging.vue'

interface DefaultStringObject {
  [key: string]: string
}
interface DefaultAnyObject {
  [key: string]: any
}
interface DefaultBoolObject {
  [key: string]: boolean
}
interface SortingField {
  field: string
  direction: string
}
const eventBus = useEventBus()
const currentPage = ref<number>(1)
const route = useRoute()
const data = ref<any[]>([])
const paging = ref<any>(undefined)
const isLoading = ref<boolean>(false)
const perPageOptions = [
  ['10', '10'],
  ['25', '25'],
  ['50', '50'],
  ['100', '100'],
]
const props = withDefaults(
  defineProps<{
    id: string
    headers: DefaultStringObject
    sortables?: DefaultBoolObject
    showHeaders?: boolean
    exportableColumns?: string[]
    csvFormatColumns?: Record<string, (value: any) => string>
    defaultPerPage?: number
    filtersData: DefaultAnyObject
    apiPath: string
    defaultSort?: SortingField
    restFunction?: Function | null
  }>(),
  {
    showHeaders: true,
    sortables: () => ({}),
    exportableColumns: () => [],
    csvFormatColumns: () => ({}),
    exportableName: 'default',
    defaultPerPage: 25,
    defaultSort: () => ({ field: 'Created', direction: 'DESC' }),
    restFunction: null,
  },
)
const rest = useRest()
const restFunction = props.restFunction ?? rest
const perPage = useStorage<number>(`${props.id}PerPage`, props.defaultPerPage)
const currentSort = useStorage<SortingField>(
  `${props.id}CurrentSort`,
  props.defaultSort,
)

// Computed properties for better reactivity
const hasData = computed(() => data.value && data.value.length > 0)
const hasExportableColumns = computed(() => props.exportableColumns.length > 0)
const hasPaging = computed(() => paging.value && paging.value.page_max > 1 && paging.value.page_no)

// Request cancellation management
const currentRequest = ref<AbortController | null>(null)
// Keep track of the latest request to prevent race conditions
const requestCounter = ref<number>(0)

async function getData(page: number = 1) {
  // Increment request counter to track the latest request
  const thisRequestNumber = requestCounter.value + 1
  requestCounter.value = thisRequestNumber

  // Cancel any ongoing request
  if (currentRequest.value) {
    currentRequest.value.abort()
    currentRequest.value = null
  }

  // Create new abort controller for this request
  currentRequest.value = new AbortController()
  const signal = currentRequest.value.signal

  isLoading.value = true
  eventBus.emit('main-loading', true)

  if (route.query.page) page = Number.parseInt(route.query.page.toString())
  const sort: any = {}
  sort[currentSort.value.field] = currentSort.value.direction
  const requestParams = {
    ...props.filtersData,
    sort,
    results_per_page: perPage.value,
    page_no: page,
  }

  try {
    // Store controller in local variable for closure safety
    const localAbortController = currentRequest.value

    const r = await restFunction(props.apiPath, 'GET', requestParams, {
      getBody: true,
      signal,
    })

    // Only process this response if it's from the most recent request
    // This prevents race conditions where a slow request returns after a newer one
    if (thisRequestNumber === requestCounter.value && localAbortController === currentRequest.value) {
      currentPage.value = page
      data.value = []
      paging.value = undefined

      if (r && r.result === 'success') {
        data.value = r.data
        paging.value = r.paging
        eventBus.emit(`${props.id}NewData`, data.value)
      }
    }
  }
  catch (error) {
    // Only log error if it's not an abort error and it's from the current request
    if (!(error instanceof DOMException && error.name === 'AbortError')
      && thisRequestNumber === requestCounter.value) {
      console.error('Error fetching data:', error)
    }
  }
  finally {
    // Only reset loading state if this is the most recent request
    if (thisRequestNumber === requestCounter.value) {
      // Clear the controller reference only if it's still the same one
      if (currentRequest.value && currentRequest.value.signal === signal) {
        currentRequest.value = null
      }
      isLoading.value = false
      eventBus.emit('main-loading', false)
    }
  }
}

function sortData(key: string) {
  if (!props.sortables[key]) return
  const newSort: SortingField = {
    field: currentSort.value.field,
    direction: currentSort.value.direction,
  }
  if (key === newSort.field) {
    if (newSort.direction === 'desc') {
      newSort.direction = 'asc'
    }
    else {
      newSort.direction = 'desc'
    }
  }
  else {
    newSort.direction = 'desc'
    newSort.field = key
  }
  currentSort.value = { ...newSort }
}

function exportToCsv() {
  if (!hasData.value || !hasExportableColumns.value) return

  const header = props.exportableColumns
    .map(column => props.headers[column] ?? column)
    .join(',')
  const rows = data.value
    .map((row) => {
      return props.exportableColumns
        .map((column) => {
          let cell = row[column]
          if (props.csvFormatColumns[column]) {
            cell = props.csvFormatColumns[column](row)
          }
          return `"${cell}"`
        })
        .join(',')
    })
    .join('\n')

  const csvContent = `${header}\n${rows}`

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `${props.id}_${new Date().toISOString().slice(0, 10)}_Page-${
      currentPage.value
    }_${perPage.value}-per-page_Order-by-${currentSort.value.field}-${
      currentSort.value.direction
    }.csv`,
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

watch(perPage, () => {
  getData()
})
watch(currentSort, () => {
  getData()
})
watch(
  () => props.filtersData,
  () => {
    getData()
  },
)
watch(
  () => props.apiPath,
  () => {
    getData()
  },
)
await getData()
onMounted(() => {
  eventBus.on(`${props.id}PagesGoToPage`, getData)
  eventBus.on(`${props.id}Reload`, getData)
  eventBus.on(`${props.id}Refresh`, getData)
})
onUnmounted(() => {
  eventBus.off(`${props.id}PagesGoToPage`, getData)
  eventBus.off(`${props.id}Reload`, getData)
  eventBus.off(`${props.id}Refresh`, getData)
})
</script>

<template>
  <div class="data-table-container bg-white dark:bg-fv-neutral-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    <!-- Table header with controls -->
    <div class="table-controls p-4 border-b border-fv-neutral-200 dark:border-fv-neutral-800">
      <div v-if="hasExportableColumns && hasData" class="flex flex-wrap items-center justify-end gap-3">
        <!-- Export button -->
        <div class="flex items-center">
          <button
            class="export-btn flex items-center justify-center gap-2 px-3 py-2 bg-fv-neutral-100 hover:bg-fv-neutral-200 text-fv-neutral-800 rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-fv-neutral-400 dark:bg-fv-neutral-800 dark:hover:bg-fv-neutral-700 dark:text-fv-neutral-200"
            @click="exportToCsv"
          >
            <ArrowDownTrayIcon class="w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">{{ $t("global_table_export") }}</span>
          </button>
        </div>
      </div>

      <!-- Pagination - top -->
      <div v-if="hasPaging" class="mt-3 flex flex-wrap justify-between items-center gap-3">
        <DefaultPaging :id="`${props.id}Pages`" :items="paging" />
        <div class="flex items-center">
          <DefaultInput
            id="perPageSelectTop"
            v-model="perPage"
            :options="perPageOptions"
            :show-label="false"
            type="select"
            class="w-20"
          />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading-spinner w-8 h-8 border-4 border-fv-neutral-200 dark:border-fv-neutral-700 border-t-fv-primary-600 dark:border-t-fv-primary-500 rounded-full animate-spin" />
    </div>

    <!-- Table view -->
    <div
      v-else-if="hasData"
      class="overflow-x-auto"
    >
      <table
        class="w-full text-sm text-left"
      >
        <thead
          v-if="showHeaders"
          class="text-xs uppercase bg-fv-neutral-50 dark:bg-fv-neutral-800 text-fv-neutral-700 dark:text-fv-neutral-300"
        >
          <tr>
            <th
              v-for="(header, key) in headers"
              :key="key"
              scope="col"
              class="px-6 py-4 whitespace-nowrap font-semibold"
              :class="{
                'cursor-pointer hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-700 transition-colors duration-200': sortables[key],
              }"
              @click="
                () => {
                  if (sortables[key]) {
                    sortData(key.toString());
                  }
                }
              "
            >
              <div class="flex items-center gap-1">
                {{ header }}
                <span v-if="sortables[key]" class="inline-flex">
                  <ArrowsUpDownIcon v-if="currentSort.field !== key" class="w-4 h-4 text-fv-neutral-400 dark:text-fv-neutral-500" aria-hidden="true" />
                  <ArrowUpIcon
                    v-else-if="currentSort.direction === 'asc'"
                    class="w-4 h-4 text-fv-primary-600 dark:text-fv-primary-400"
                    aria-hidden="true"
                  />
                  <ArrowDownIcon
                    v-else
                    class="w-4 h-4 text-fv-primary-600 dark:text-fv-primary-400"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in data"
            :key="index"
            class="bg-white border-b dark:bg-fv-neutral-900 dark:border-fv-neutral-800 hover:bg-fv-neutral-50 dark:hover:bg-fv-neutral-900 transition-colors duration-200"
          >
            <td
              v-for="(header, key) in headers"
              :key="key"
              class="px-6 py-4 align-middle"
            >
              <slot :name="key" :value="row">
                <template v-if="row[key]">
                  {{ row[key] }}
                </template>
                <template v-else>
                  <span class="text-fv-neutral-400 dark:text-fv-neutral-600">{{ $t("global_table_empty_cell") }}</span>
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="py-12 px-4 text-center">
      <div class="empty-state flex flex-col items-center justify-center">
        <svg class="w-16 h-16 text-fv-neutral-300 dark:text-fv-neutral-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <p class="text-lg font-medium text-fv-neutral-700 dark:text-fv-neutral-300">
          {{ $t("no_data_found") }}
        </p>
        <p class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400 max-w-md mt-1">
          {{ $t("try_another_search") }}
        </p>
      </div>
    </div>

    <!-- Pagination - bottom -->
    <div v-if="hasPaging" class="px-4 py-3 border-t border-fv-neutral-200 dark:border-fv-neutral-800">
      <div class="flex flex-wrap justify-between items-center gap-3">
        <DefaultPaging :id="`${props.id}Pages`" :items="paging" />
        <div class="flex items-center">
          <DefaultInput
            id="perPageSelectBottom"
            v-model="perPage"
            :options="perPageOptions"
            :show-label="false"
            type="select"
            class="w-20"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table-container {
  @apply transition-shadow duration-300;
}

/* Responsive styles */
@media (max-width: 640px) {
  .table-controls {
    @apply p-3;
  }

  td, th {
    @apply px-3 py-3;
  }
}

/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
  will-change: transform;
}

/* Fade in animation for rows */
tbody tr {
  animation: fadeIn 0.2s ease-out;
  will-change: opacity;
}

@keyframes fadeIn {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

/* Improved hover states for better interactivity */
th[scope="col"]:hover {
  @apply transition-colors duration-200;
}
tbody tr:hover {
  @apply transition-colors duration-200;
}

/* Zebra striping for better readability */
@media (prefers-reduced-motion: no-preference) {
  tbody tr:nth-child(odd) {
    @apply bg-fv-neutral-50 dark:bg-fv-neutral-900;
  }

  tbody tr:nth-child(odd):hover {
    @apply bg-fv-neutral-100 dark:bg-fv-neutral-800;
  }
}

/* Accessible focus styles */
button:focus-visible,
a:focus-visible {
  @apply outline-none ring-2 ring-fv-primary-500 ring-offset-2 dark:ring-offset-fv-neutral-900;
}

/* Export button hover effect */
.export-btn {
  @apply relative overflow-hidden;
}

.export-btn::after {
  content: '';
  @apply absolute inset-0 opacity-0 transition-opacity duration-200;
}

.export-btn:hover::after {
  @apply opacity-10 bg-black dark:bg-white;
}

/* Additional dark mode color for better contrast */
.dark .data-table-container {
  @apply bg-fv-neutral-900;
}

.dark tbody tr:nth-child(odd) {
  @apply bg-fv-neutral-900;
}

.dark tbody tr:hover {
  @apply bg-fv-neutral-800;
}
</style>
