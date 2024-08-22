<script setup lang="ts">
// @ts-ignore
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/solid";
import {
  watch,
  onUnmounted,
  ref,
  WatchStopHandle,
  onMounted,
  computed,
} from "vue";
import type { APIPaging } from "../../composables/rest";
import { useEventBus } from "../../composables/event-bus";
import { useServerRouter } from "../../stores/serverRouter";
import { LocationQueryValue, RouteLocationRaw, useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import { hasFW, getURL } from "@fy-/fws-js";

const props = withDefaults(
  defineProps<{
    items: APIPaging;
    id: string;
    hash?: string;
    showLegend?: boolean;
  }>(),
  {
    showLegend: true,
    hash: "",
  },
);
const route = useRoute();
const eventBus = useEventBus();
const history = useServerRouter();
const prevNextSeo = ref<any>({});
const isNewPage = (page: number) => {
  return (
    page >= 1 && page <= props.items.page_max && page != props.items.page_no
  );
};
const pageWatcher = ref<WatchStopHandle>();

const next = () => {
  const page = props.items.page_no + 1;

  if (!isNewPage(page)) return;
  const newQuery = { ...route.query };
  newQuery.page = page.toString();
  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash != "" ? "#" + props.hash : undefined,
  });
};
const prev = () => {
  const page = props.items.page_no - 1;
  if (!isNewPage(page)) return;
  const newQuery = { ...route.query };
  newQuery.page = page.toString();
  history.push({
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash != "" ? "#" + props.hash : undefined,
  });
};

const page = (page: number): RouteLocationRaw => {
  const newQuery = { ...route.query };
  newQuery.page = page.toString();
  return {
    path: history.currentRoute.path,
    query: newQuery,
    hash: props.hash != "" ? "#" + props.hash : undefined,
  };
};
const currentUrl = computed(() => {
  /*
  const url = getURL();
  return `${url.Path}?page=`;
  */
  // user router url instead of getURL
  return `${history.currentRoute.path}?page=`;
});

const checkPageNumber = (page: number = 1) => {
  prevNextSeo.value.next = undefined;
  prevNextSeo.value.prev = undefined;
  const pagePlus = page + 1;
  const pageMinus = page - 1;
  if (hasFW()) {
    const url = getURL();
    if (pagePlus <= props.items.page_max && url) {
      prevNextSeo.value.next =
        `${url.Scheme}://${url.Host}${route.path}?page=${pagePlus}` +
        (props.hash != "" ? `#${props.hash}` : "");
    }
    if (pageMinus >= 1 && url) {
      prevNextSeo.value.prev =
        `${url.Scheme}://${url.Host}${route.path}?page=${pageMinus}` +
        (props.hash != "" ? `#${props.hash}` : "");
    }
  }
};

pageWatcher.value = watch(
  () => route.query.page,
  (v) => {
    eventBus.emit(`${props.id}GoToPage`, v ? v : 1);
  },
);
onMounted(() => {
  eventBus.on(`${props.id}GoToPage`, checkPageNumber);
});
onUnmounted(() => {
  eventBus.off(`${props.id}GoToPage`, checkPageNumber);
  //if (pageWatcher.value) pageWatcher.value();
});

checkPageNumber(props.items.page_no);
useHead({
  link: computed(() => {
    const result: any = [];
    if (prevNextSeo.value.next)
      result.push({
        href: prevNextSeo.value.next,
        rel: "next",
        key: "next",
      });
    if (prevNextSeo.value.prev)
      result.push({
        href: prevNextSeo.value.prev,
        rel: "prev",
        key: "prev",
      });

    return result;
  }),
});
</script>
<template>
  <div
    class="flex items-center justify-center"
    v-if="items && items.page_max > 1 && items.page_no"
  >
    <div class="paging-container">
      <nav aria-label="Pagination">
        <ul class="flex items-center -space-x-px h-8 text-sm">
          <li v-if="items.page_no >= 2">
            <button
              type="button"
              @click="prev()"
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
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
              v-if="items.page_no - 2 > 2"
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
            >
              ...
            </div>
          </li>
          <template v-for="i in 2">
            <li
              v-if="items.page_no - (3 - i) >= 1"
              :key="`page-${items.page_no + i}`"
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
              class="z-10 flex items-center justify-center px-3 h-8 leading-tight text-primary-600 border border-primary-300 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 dark:border-fv-neutral-700 dark:bg-fv-neutral-700 dark:text-white"
            >
              {{ items.page_no }}
            </div>
          </li>
          <template v-for="i in 2">
            <li
              :key="`page-x-${items.page_no + i}`"
              v-if="items.page_no + i <= items.page_max"
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
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
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
          <li v-if="items.page_no < items.page_max - 1">
            <button
              @click="next()"
              type="button"
              class="flex items-center justify-center px-1.5 h-8 leading-tight text-fv-neutral-500 bg-white border border-fv-neutral-300 hover:bg-fv-neutral-100 hover:text-fv-neutral-700 dark:bg-fv-neutral-800 dark:border-fv-neutral-700 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:hover:text-white"
            >
              <span class="sr-only">{{ $t("next_paging") }}</span>
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
      <p
        class="text-xs text-fv-neutral-700 dark:text-fv-neutral-400 pt-0.5"
        v-if="showLegend"
      >
        {{
          $t("global_paging", {
            start: items.results_per_page * (items.page_no - 1),
            end: items.results_per_page * items.page_no,
            total: items.count >= 10000 ? $t("paging_a_lot_of") : items.count,
          })
        }}
      </p>
    </div>
  </div>
</template>
