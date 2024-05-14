<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useEventBus, useRest } from "@fy-/fws-vue";
import BBReply from "./BBReply.vue";
import { useBBStore } from "./bbStore";

const eventBus = useEventBus();
const wStore = useBBStore();
const upvoted = computed(() => wStore.ForumsUpvotesComment);
const downvoted = computed(() => wStore.ForumsDownvotesComment);
const rest = useRest();

const props = withDefaults(
  defineProps<{
    post: any;
    childs?: any;
  }>(),
  {
    childs: null,
  },
);
const replies = ref();
const repliesOpen = ref({});
async function getReplies() {
  eventBus.emit("main-loading", true);
  repliesOpen.value = {};
  replies.value = undefined;
  const data = await rest(
    `ObelixBB/${props.post.BoardUUID}/Replies/${props.post.Slug}`,
    "GET",
  ).catch(() => {
    replies.value = [];
    eventBus.emit("main-loading", false);
  });
  if (data && data.result === "success") {
    replies.value = data.data;
  } else {
    replies.value = [];
  }
  eventBus.emit("main-loading", false);
}

async function upvote(id: string, type = "upvote", object = "post") {
  eventBus.emit("main-loading", true);
  const _r = await rest(`ObelixBB/Vote/${type}/${object}/${id}`, "POST", {});
  if (_r && _r.result === "success") {
    eventBus.emit("reloadBB", true);
    eventBus.emit("refreshBBProfile", true);
  }
  eventBus.emit("main-loading", false);
}

onMounted(async () => {
  if (props.childs === null) {
    await getReplies();
  } else {
    replies.value = props.childs;
  }
  eventBus.on("reloadBB", getReplies);
});

onUnmounted(() => {
  eventBus.off("reloadBB", getReplies);
});
</script>

<template>
  <template v-if="replies && replies.length">
    <div
      id="replies"
      v-for="reply in replies"
      :key="`${reply.ID}-${post.ID}-${reply.Depth}`"
      class="relative pl-6"
      itemprop="comment"
      itemscope
      itemtype="http://schema.org/Comment"
    >
      <div
        class="w-4 h-4 rounded-full bg-fv-neutral-600 absolute -top-1s left-0.5 z-2"
      />
      <div
        class="w-[4px] bg-fv-neutral-600 top-2 bottom-2 absolute left-2 z-1"
      />
      <div class="text-fv-neutral-500 text-xs mb-1">
        <span class="text-fv-neutral-400">
          <b itemprop="author">@{{ reply.User.Username }}</b>
        </span>
        on
        <time itemprop="dateCreated" :datetime="reply.CreatedAt.iso">{{
          $formatDate(reply.CreatedAt.iso)
        }}</time
        >.
      </div>
      <p itemprop="text" class="text-fv-neutral-300 text-sm">
        {{ reply.Message }}
      </p>
      <div class="flex items-center mt-1 gap-3 pb-3">
        <div class="flex items-center gap-x-2 text-fv-neutral-400">
          <button
            :class="{
              'text-green-500 cursor-auto': upvoted.includes(reply.ID),
              'text-fv-neutral-500 cursor-auto': downvoted.includes(reply.ID),
            }"
            @click="
              () => {
                if (
                  !upvoted.includes(reply.ID) &&
                  !downvoted.includes(reply.ID)
                ) {
                  upvote(reply.ID, 'upvote', 'reply');
                }
              }
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-5 h-5"
            >
              <path
                fill-rule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.53 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v5.69a.75.75 0 0 0 1.5 0v-5.69l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <div class="font-bold">
            {{ reply.Score ? reply.Score : 0 }}
          </div>
          <button
            :class="{
              'text-green-500 cursor-auto': downvoted.includes(reply.ID),
              'text-fv-neutral-500 cursor-auto': upvoted.includes(reply.ID),
            }"
            @click="
              () => {
                if (
                  !downvoted.includes(reply.ID) &&
                  !upvoted.includes(reply.ID)
                ) {
                  upvote(reply.ID, 'downvote', 'reply');
                }
              }
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-5 h-5"
            >
              <path
                fill-rule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.53 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8.25a.75.75 0 0 0-1.5 0v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <button
          v-if="reply.Depth <= 5"
          class="btn text-fv-neutral-400 small"
          @click="
            () => {
              repliesOpen[reply.ID] = !repliesOpen[reply.ID];
            }
          "
        >
          Reply
        </button>
      </div>
      <div
        v-if="repliesOpen[reply.ID] || reply.Childrens.length"
        class="relative"
      >
        <div class="w-[4px] bg-fv-neutral-600 top-0 bottom-2 absolute left-2" />

        <BBReply
          v-if="repliesOpen[reply.ID]"
          :post="props.post"
          :in-reply-to="reply.ID"
          class="-mt-5"
        />
        <BBReplies :post="props.post" :childs="reply.Childrens" />
      </div>
    </div>
  </template>
</template>
