<script setup lang="ts">
import { DefaultBreadcrumb, useRest } from "@fy-/fws-vue";
import { computed, ref } from "vue";
import BBFooter from "./BBFooter.vue";

const rest = useRest();
const boards = ref();
async function getBoards() {
  const d = await rest("ObelixBB", "GET");
  if (d && d.result === "success") {
    boards.value = d.data;
  }
}
const boardsGroupByGroupIndex = computed(() => {
  if (!boards.value) return [];
  const groups = {} as any;
  boards.value.forEach((bb: any) => {
    if (!groups[bb.GroupIndex]) {
      groups[bb.GroupIndex] = [];
    }
    groups[bb.GroupIndex].push(bb);
  });
  return Object.values(groups) as any;
});

await getBoards();
</script>

<template>
  <div class="bb-base-container px-1">
    <div class="mb-1 px-1">
      <DefaultBreadcrumb
        :nav="[{ name: $t('bb_home_bc') }]"
        :show-home="false"
      />
    </div>
    <div class="flex flex-col gap-3">
      <section
        v-for="(bg, index) in boardsGroupByGroupIndex"
        :key="`group_${index}`"
        class="flex shadow flex-col bb-kik"
      >
        <div class="flex w-full px-4 text-xs font-medium uppercase my-1">
          <div class="flex-1 pr-0.5">
            {{ $t("bb_th_forum") }}
          </div>
          <div class="flex-0 grow-0 shrink 0 w-16 px-0.5 text-center">
            {{ $t("bb_th_post_count") }}
          </div>
          <div class="flex-0 grow-0 shrink 0 w-16 px-0.5 text-center">
            {{ $t("bb_th_reply_count") }}
          </div>
          <div
            class="flex-0 grow-0 shrink 0 w-64 pl-0.5 hidden lg:block text-right"
          >
            {{ $t("bb_th_last_post") }}
          </div>
        </div>
        <router-link
          v-for="(bb, idx2) in bg"
          :key="bb.UUID"
          :title="bb.Name"
          :to="`/forums/${bb.UUID}`"
          :class="{
            'mb-1': idx2 !== bg.length - 1,
          }"
          class="px-2 bb-kikk rounded-lg"
        >
          <div
            class="mx-2 flex w-auto items-center divide-x divide-fv-neutral-900/[.2] dark:divide-fv-neutral-300/[.2]"
          >
            <div class="flex-1 pr-0.5">
              <h2 class="h3">
                {{ bb.Name }}
              </h2>
              <p
                class="text-sm text-white/[.6] dark:text-white/[.6] hidden lg:block"
              >
                {{ bb.Description }}
              </p>
            </div>
            <div class="flex-0 grow-0 shrink 0 w-16 px-0.5 text-center">
              {{ bb.PostCount ? bb.PostCount : 0 }}
            </div>
            <div class="flex-0 grow-0 shrink 0 w-16 px-0.5 text-center">
              {{ bb.ReplyCount ? bb.ReplyCount : 0 }}
            </div>
            <div
              class="flex-0 grow-0 shrink 0 w-64 pl-0.5 hidden lg:block text-right"
            >
              <div class="text-sm text-white/[.6] dark:text-white/[.6]">
                <div v-if="bb.LastPost && bb.LastPost.ID">
                  <RouterLink
                    :to="`/forums/${bb.UUID}/${bb.LastPost.Slug}`"
                    :title="bb.LastPost.Title"
                  >
                    <b>{{ bb.LastPost.Title }}</b> </RouterLink
                  >, {{ $formatTimeago(bb.LastPost.CreatedAt.iso) }}
                </div>
                <span v-else>
                  {{ $t("bb_no_post") }}
                </span>
              </div>
            </div>
          </div>
        </router-link>
      </section>
    </div>
    <BBFooter />
  </div>
</template>
