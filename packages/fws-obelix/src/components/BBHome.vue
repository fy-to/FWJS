<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  DefaultBreadcrumb,
  useEventBus,
  useRest,
  useSeo,
  useTranslation,
} from "@fy-/fws-vue";
import { useRoute } from "vue-router";
import BBPost from "./BBPost.vue";
import BBFooter from "./BBFooter.vue";

const props = withDefaults(
  defineProps<{
    notFoundPage: any;
    isSingle?: boolean;
  }>(),
  {
    isSingle: false,
  },
);

const rest = useRest();
const route = useRoute();
const eventBus = useEventBus();
const posts = ref();
const order = ref("t");
const is404 = ref(false);
async function getPosts() {
  eventBus.emit("main-loading", true);
  is404.value = false;
  if (!props.isSingle) {
    const data = await rest(
      `ObelixBB/${route.params.uuid.toString()}/${order.value}`,
      "GET",
    );
    if (data && data.result === "success") {
      posts.value = data.data;
    } else {
      is404.value = true;
    }
  } else {
    const data = await rest(
      `ObelixBB/${route.params.uuid.toString()}/Post/${route.params.slug}`,
      "GET",
    );
    if (data && data.result === "success") {
      posts.value = data.data;
    } else {
      is404.value = true;
    }
  }

  eventBus.emit("main-loading", false);
}

await getPosts();

onMounted(() => {
  eventBus.on("reloadBB", getPosts);
});
onUnmounted(() => {
  eventBus.off("reloadBB", getPosts);
});

watch(
  () => [route.params.uuid, order.value],
  () => {
    getPosts();
  },
);

useSeo(
  ref({
    title: computed(() => {
      if (props.isSingle) {
        return `${posts.value?.Post?.Title} - ${posts.value?.Board?.Name}`;
      }
      return `${posts.value?.Board?.Name} - Forums`;
    }),
  }),
);
const translate = useTranslation();
const nav = computed(() => {
  if (props.isSingle) {
    return [
      { name: translate("bb_home_bc"), to: "/forums" },
      { name: posts.value.Board.Name, to: `/forums/${posts.value.Board.UUID}` },
      { name: posts.value.Post.Title },
    ];
  }
  return [
    { name: translate("bb_home_bc"), to: "/forums" },
    { name: posts.value.Board.Name },
  ];
});
</script>

<template>
  <div v-if="posts && !is404" class="mt-4">
    <div class="bb-container-base flex shadow flex-col bb-kik">
      <div class="px-2 mb-1">
        <DefaultBreadcrumb :nav="nav" :show-home="false" />
      </div>
      <template v-if="!props.isSingle">
        <div class="px-2 pb-1.5 rounded-lg !pt-3">
          <h1 class="h1">
            {{ posts.Board.Name }}
          </h1>
          <p class="text-lg">
            {{ posts.Board.Description }}
          </p>
          <div v-if="!isSingle" class="flex items-center justify-between mt-2">
            <div class="flex gap-2">
              <button
                class="btn neutral small flex items-center"
                :class="{ '!bg-fv-accent-800': order === 'new' }"
                @click="order = 'new'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5"
                  />
                </svg>

                {{ $t("bb_sort_new_cta") }}
              </button>
              <button
                class="btn neutral small flex items-center"
                :class="{ '!bg-fv-accent-800': order === 't' }"
                @click="order = 't'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                  />
                </svg>
                {{ $t("bb_sort_top_cta") }}
              </button>
              <button
                class="btn neutral small flex items-center"
                :class="{ '!bg-fv-accent-800': order === 'c' }"
                @click="order = 'c'"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21"
                  />
                </svg>

                {{ $t("bb_sort_controversial_cta") }}
              </button>
            </div>
            <router-link
              class="btn primary small !text-base"
              :to="`/forums/${posts.Board.UUID}/new`"
            >
              {{ $t("bb_new_post_cta") }}
            </router-link>
          </div>
        </div>
      </template>
    </div>

    <div class="flex-1 bb-base-container">
      <div
        v-if="!isSingle && posts.Posts.length === 0"
        class="text-center bg-fv-neutral-900 mx-auto rounded-xl p-4"
      >
        <p
          class="text-lg mb-3"
          v-html="
            $t('bb_no_articles', {
              name: posts.Board.Name,
            })
          "
        />
        <router-link
          class="btn accent large"
          :to="`/forums/${posts.Board.UUID}/new`"
        >
          {{ $t("bb_new_post_cta") }}
        </router-link>
      </div>
      <div v-else-if="!isSingle" class="flex flex-col gap-2">
        <BBPost
          v-for="post in posts.Posts"
          :key="post.ID"
          :post="post"
          :posts="posts"
        />
      </div>
      <div v-else-if="isSingle">
        <BBPost :post="posts.Post" :is-single="true" :posts="posts.Replies" />
      </div>
    </div>
  </div>
  <notFoundPage v-else-if="is404" />
  <BBFooter />
</template>
