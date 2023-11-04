<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/solid";
import {
  watch,
  onUnmounted,
  ref,
  WatchStopHandle,
  onMounted,
  computed,
} from "vue";
import type { APIPaging } from "../../rest";
import { useEventBus } from "../../event-bus";
import { useServerRouter } from "../../stores/serverRouter";
import { useRoute } from "vue-router";
import { useFyHead } from "@fy-/head";
const props = defineProps<{
  items: APIPaging;
  id: string;
}>();
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

  history.push({
    path: history.currentRoute.path,
    query: { page: page.toString() },
  });
};
const prev = () => {
  const page = props.items.page_no - 1;
  if (!isNewPage(page)) return;

  history.push({
    path: history.currentRoute.path,
    query: { page: page.toString() },
  });
};
const page = (page: number) => {
  if (!isNewPage(page)) return;

  history.push({
    path: history.currentRoute.path,
    query: { page: page.toString() },
  });
};

const checkPageNumber = (page: number = 1) => {
  prevNextSeo.value.next = undefined;
  prevNextSeo.value.prev = undefined;

  /* @ts-ignore */
  if (typeof FW !== "undefined") {
    /* @ts-ignore */
    if (page + 1 <= props.items.page_max && FW.URL) {
      /* @ts-ignore */
      // eslint-disable-next-line
      prevNextSeo.value.next = `${FW.URL.scheme}://${FW.URL.host}${FW.URL.path}?page=${page + 1}`;
    }
    /* @ts-ignore */
    if (page - 1 >= 1 && FW.URL) {
      /* @ts-ignore */
      // eslint-disable-next-line
      prevNextSeo.value.prev = `${FW.URL.scheme}://${FW.URL.host}${FW.URL.path}?page=${page - 1}`;
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
useFyHead({
  links: computed(() => {
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
      <nav
        aria-label="Pagination"
        class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
      >
        <a
          href="javascript:void(0);"
          @click="prev()"
          v-if="items.page_no >= 2"
          class="relative inline-flex items-center px-2 pt-2 pb-1.5 border text-sm font-medium border-fv-neutral-300 bg-fv-neutral-100 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:border-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
        >
          <span class="sr-only">{{ $t("previous_paging") }}</span>
          <ChevronLeftIcon class="w-4 h-4" />
        </a>
        <a
          v-if="items.page_no - 2 > 1"
          class="relative inline-flex items-center px-4 pt-2 pb-1.5 border text-sm font-medium bg-fv-neutral-100 border-fv-neutral-300 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:bg-fv-neutral-800 dark:border-fv-neutral-600 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
          href="javascript:void(0);"
          @click="page(1)"
        >
          1
        </a>
        <span
          v-if="items.page_no - 2 > 2"
          class="relative inline-flex items-center px-2 pt-2 pb-1.5 border text-sm font-medium border-fv-neutral-300 bg-fv-neutral-100 text-fv-neutral-700 hover:text-fv-neutral-600 dark:border-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-700 dark:hover:text-fv-neutral-100"
        >
          ...
        </span>
        <template v-for="i in 2">
          <a
            v-if="items.page_no - (3 - i) >= 1"
            class="relative inline-flex items-center px-4 pt-2 pb-1.5 border text-sm font-medium bg-fv-neutral-100 border-fv-neutral-300 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:bg-fv-neutral-800 dark:border-fv-neutral-600 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
            href="javascript:void(0);"
            :key="`${i}-sm`"
            @click="page(items.page_no - (3 - i))"
          >
            {{ items.page_no - (3 - i) }}
          </a>
        </template>
        <a
          href="#"
          aria-current="page"
          class="z-10 relative inline-flex items-center px-4 pt-2 pb-1.5 border text-sm font-medium font-bold bg-fv-primary-50 border-fv-primary-500 text-fv-primary-600 hover:text-fv-neutral-600 dark:bg-fv-primary-900 dark:border-fv-primary-500 dark:text-fv-primary-200 dark:hover:text-fv-neutral-100"
        >
          {{ items.page_no }}
        </a>
        <template v-for="i in 2">
          <a
            v-if="items.page_no + i <= items.page_max"
            class="relative inline-flex items-center px-4 pt-2 pb-1.5 border text-sm font-medium bg-fv-neutral-100 border-fv-neutral-300 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:bg-fv-neutral-800 dark:border-fv-neutral-600 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
            href="javascript:void(0);"
            :key="`${i}-md`"
            @click="page(items.page_no + i)"
          >
            {{ items.page_no + i }}
          </a>
        </template>
        <span
          v-if="items.page_no + 2 < items.page_max - 1"
          class="relative inline-flex items-center px-2 pt-2 pb-1.5 border text-sm font-medium border-fv-neutral-300 bg-fv-neutral-100 text-fv-neutral-700 hover:text-fv-neutral-600 dark:border-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-700 dark:hover:text-fv-neutral-100"
        >
          ...
        </span>
        <a
          v-if="items.page_no + 2 < items.page_max"
          class="relative inline-flex items-center px-4 pt-2 pb-1.5 border text-sm font-medium bg-fv-neutral-100 border-fv-neutral-300 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:bg-fv-neutral-800 dark:border-fv-neutral-600 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
          href="javascript:void(0);"
          @click="page(items.page_max)"
        >
          {{ items.page_max }}
        </a>
        <a
          href="javascript:void(0);"
          @click="next()"
          v-if="items.page_no < items.page_max - 1"
          class="relative inline-flex items-center px-2 pt-2 pb-1.5 border text-sm font-medium border-fv-neutral-300 bg-fv-neutral-100 text-fv-neutral-500 hover:bg-fv-neutral-200 hover:text-fv-neutral-600 dark:border-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-200 dark:hover:bg-fv-neutral-800 dark:hover:text-fv-neutral-100"
        >
          <span class="sr-only">{{ $t("next_paging") }}</span>
          <ChevronRightIcon class="w-4 h-4" />
        </a>
      </nav>
      <p
        class="text-xs text-center italic mt-0.5 text-fv-neutral-700 dark:text-fv-neutral-300"
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
