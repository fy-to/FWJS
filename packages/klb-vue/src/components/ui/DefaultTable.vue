<script setup lang="ts">
import { reactive, computed } from "vue";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/vue/24/solid";

const props = withDefaults(
  defineProps<{
    headers: Record<string, string>;
    data: any[];
    sortables?: Record<string, boolean>;
    showHeaders?: boolean;
    exportableColumns?: string[];
    exportableName?: string;
    csvFormatColumns?: Record<string, (value: any) => string>;
  }>(),
  {
    showHeaders: true,
    sortables: () => ({}),
    exportableColumns: () => [],
    csvFormatColumns: () => ({}),
    exportableName: "default",
  },
);

const currentSort = reactive({
  key: "",
  direction: "none",
});

const exportToCsv = () => {
  const header = props.exportableColumns
    .map((column) => props.headers[column] ?? column)
    .join(",");
  const rows = sortedData.value
    .map((row) => {
      return props.exportableColumns
        .map((column) => {
          let cell = row[column];
          if (props.csvFormatColumns[column]) {
            cell = props.csvFormatColumns[column](row);
          }
          return `"${cell}"`;
        })
        .join(",");
    })
    .join("\n");

  const csvContent = header + "\n" + rows;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", props.exportableName + ".csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const sortedData = computed(() => {
  if (currentSort.direction == "none") {
    return props.data.slice();
  }
  const sorted = props.data.slice().sort((a, b) => {
    if (currentSort.key === "") return 0;

    const aValue = a[currentSort.key];
    const bValue = b[currentSort.key];

    if (!isNaN(aValue) && !isNaN(bValue)) {
      return aValue - bValue;
    }

    return String(aValue).localeCompare(String(bValue));
  });

  if (currentSort.direction === "desc") {
    sorted.reverse();
  }
  return sorted;
});

const sortData = (key: string) => {
  currentSort.key = key;
  currentSort.direction =
    currentSort.direction === "asc" || currentSort.direction == "none"
      ? "desc"
      : "asc";
};
</script>
<template>
  <div>
    <div
      v-if="exportableColumns.length && sortedData.length"
      class="flex justify-end items-end mb-2"
    >
      <button class="btn primary small" @click="exportToCsv">
        <ArrowDownTrayIcon class="w-4 h-4 mr-2"></ArrowDownTrayIcon
        >{{ $t("global_table_export") }}
      </button>
    </div>
    <div
      class="relative overflow-x-auto border-fv-primary-600 sm:rounded-lg"
      v-if="sortedData.length"
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
              @click="
                () => {
                  if (sortables[key]) {
                    sortData(key.toString());
                  }
                }
              "
              scope="col"
              class="px-6 py-3 whitespace-nowrap"
              :class="{
                'cursor-pointer': sortables[key],
              }"
            >
              {{ header }}
              <template v-if="sortables[key] && currentSort.key == key">
                <ArrowUpIcon
                  v-if="currentSort.direction == 'desc'"
                  class="inline w-3 h-3 align-top mt-0.5"
                />
                <ArrowDownIcon v-else class="inline w-3 h-3 align-top mt-0.5" />
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedData"
            :key="index"
            class="bg-white border-b dark:bg-fv-neutral-900 dark:border-fv-neutral-800 hover:bg-fv-neutral-50 dark:hover:bg-fv-neutral-950"
          >
            <td v-for="(header, key) in headers" :key="key" class="px-6 py-4">
              <slot :name="key" :value="row">
                <template v-if="row[key]">{{ row[key] }} </template>
                <template v-else>{{ $t("global_table_empty_cell") }}</template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-4 py-2" v-else>
      {{ $t("no_table_data") }}
    </div>
  </div>
</template>
