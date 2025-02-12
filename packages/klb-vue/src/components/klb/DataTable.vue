<script setup lang="ts">
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
} from '@heroicons/vue/24/solid'
import { useStorage } from '@vueuse/core'
import { onMounted, onUnmounted, ref, watch } from 'vue'
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
const rest = useRest()
const data = ref<any[]>([])
const paging = ref<any>(undefined)
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
    subData?: boolean
    errorMessage?: string
    subQuery?: boolean
    subQueryExclude?: string[]
    variations?: string[]
  }>(),
  {
    errorMessage: 'no_data_found',
    subData: false,
    showHeaders: true,
    sortables: () => ({}),
    exportableColumns: () => [],
    subQueryExclude: () => [],
    csvFormatColumns: () => ({}),
    variations: () => [],
    exportableName: 'default',
    defaultPerPage: 25,
    defaultSort: () => ({ field: 'Created', direction: 'DESC' }),
    subQuery: false,
  },
)
const perPage = useStorage<number>(`${props.id}PerPage`, props.defaultPerPage)
const currentSort = useStorage<SortingField>(
  `${props.id}CurrentSort`,
  props.defaultSort,
)
async function getData(page: number = 1) {
  eventBus.emit('main-loading', true)
  if (route.query.page) page = Number.parseInt(route.query.page.toString())
  let sort: any = {}
  if (!props.subData) {
    sort[currentSort.value.field] = currentSort.value.direction
  }
  else {
    sort = `${currentSort.value.field}:${currentSort.value.direction}`
  }
  let query = { ...props.filtersData }
  if (props.subQuery) {
    const basedata: any = {}
    const queryData: any = {}
    Object.keys(query).forEach((key) => {
      if (!props.subQueryExclude.includes(key)) {
        queryData[key] = query[key]
      }
      else {
        basedata[key] = query[key]
      }
    })
    basedata.query = queryData
    query = basedata
  }
  const requestParams = {
    ...query,
    sort,
    results_per_page: perPage.value,
    page_no: page,
  } as DefaultAnyObject
  eventBus.emit('dataTableRequestParams', requestParams)
  if (props.variations && props.variations.length > 0) {
    requestParams.image_variation = props.variations
  }
  const r = await rest(props.apiPath, 'GET', requestParams)
  currentPage.value = page
  data.value = []
  paging.value = undefined
  if (r && r.result === 'success') {
    data.value = props.subData ? r.data.data : r.data
    paging.value = r.paging
    eventBus.emit(`${props.id}NewData`, data.value)
  }
  eventBus.emit('main-loading', false)
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
onMounted(() => {
  eventBus.on(`${props.id}PagesGoToPage`, getData)
  eventBus.on(`${props.id}Reload`, getData)
  eventBus.on(`${props.id}Refresh`, getData)

  getData()
})
onUnmounted(() => {
  eventBus.off(`${props.id}PagesGoToPage`, getData)
  eventBus.off(`${props.id}Reload`, getData)
  eventBus.off(`${props.id}Refresh`, getData)
})
</script>

<template>
  <div>
    <div
      class="flex gap-2 justify-between items-center border-b border-fv-primary-600 mb-2 pb-2"
    >
      <DefaultPaging v-if="paging" :id="`${props.id}Pages`" :items="paging" />
      <button
        v-if="exportableColumns.length && data.length"
        class="btn primary defaults"
        @click="exportToCsv"
      >
        <ArrowDownTrayIcon class="w-4 h-4 mr-2" />{{ $t("global_table_export") }}
      </button>
      <DefaultInput
        :id="`${id}PerPage`"
        v-model="perPage"
        :options="perPageOptions"
        :show-label="false"
        type="select"
        class="w-20"
      />
    </div>

    <div
      v-if="data.length"
      class="relative overflow-x-auto border-fv-primary-600 sm:rounded-lg"
    >
      <table
        class="w-full text-sm text-left text-fv-neutral-500 dark:text-fv-neutral-400"
      >
        <thead
          v-if="showHeaders"
          class="text-xs text-fv-neutral-700 uppercase bg-fv-neutral-50 dark:bg-fv-neutral-800 dark:text-fv-neutral-400"
        >
          <tr>
            <th
              v-for="(header, key) in headers"
              :key="key"
              scope="col"
              class="px-6 py-3 whitespace-nowrap"
              :class="{
                'cursor-pointer': sortables[key],
              }"
              @click="
                () => {
                  if (sortables[key]) {
                    sortData(key.toString());
                  }
                }
              "
            >
              {{ header }}
              <template v-if="sortables[key] && currentSort.field === key">
                <ArrowUpIcon
                  v-if="currentSort.direction === 'desc'"
                  class="inline w-3 h-3 align-top mt-0.5"
                />
                <ArrowDownIcon v-else class="inline w-3 h-3 align-top mt-0.5" />
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in data"
            :key="index"
            class="bg-white border-b dark:bg-fv-neutral-900 dark:border-fv-neutral-800 hover:bg-fv-neutral-50 dark:hover:bg-fv-neutral-950"
          >
            <td v-for="(header, key) in headers" :key="key" class="px-6 py-4">
              <slot :name="key" :value="row">
                <template v-if="row[key]">
                  {{ row[key] }}
                </template>
                <template v-else>
                  {{ $t("global_table_empty_cell") }}
                </template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else
      class="text-center text-fv-neutral-600 dark:text-fv-neutral-300 italic p-2"
    >
      {{ $t(errorMessage) }}
    </div>
  </div>
</template>
