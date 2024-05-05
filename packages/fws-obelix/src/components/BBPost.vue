<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useEventBus, useRest, useUserStore } from "@fy-/fws-vue";
import { getRealm } from "@fy-/fws-js";
import { RouterLink } from "vue-router";
import markdownit from "markdown-it";
import { Dropdown } from "flowbite";
import { EllipsisVerticalIcon, PaperClipIcon } from "@heroicons/vue/24/solid";
import BBReply from "./BBReply.vue";
import BBReplies from "./BBReplies.vue";
import { useBBStore } from "./bbStore";

const md = markdownit();

const props = withDefaults(
  defineProps<{
    post: any;
    posts: any;
    isSingle?: boolean;
  }>(),
  {
    isSingle: false,
  },
);
const store = useUserStore();
const userID = computed(() => store.user?.UUID);
const isAuth = computed(() => store.isAuth);
const isAdmin = computed(() => {
  if (isAuth.value && store.user && store.user.Roles) {
    for (const role of store.user.Roles) {
      if (
        role.Role === "Administrator" &&
        // @ts-expect-error: weird ts behavior
        role.RealmUUID === getRealm().UUID
      ) {
        return true;
      }
    }
  }

  return false;
});
const bbStore = useBBStore();
const upvoted = computed(() =>
  bbStore.ForumsUpvotesPost.includes(props.post.ID),
);
const downvoted = computed(() =>
  bbStore.ForumsDownvotesPost.includes(props.post.ID),
);
const eventBus = useEventBus();
const rest = useRest();

async function upvote(id: string, type = "upvote", object = "post") {
  eventBus.emit("main-loading", true);
  const _r = await rest(`ObelixBB/Vote/${type}/${object}/${id}`, "POST", {});
  if (_r && _r.result === "success") {
    eventBus.emit("reloadBB", true);
    eventBus.emit("refreshBBProfile", true);
  }
  eventBus.emit("main-loading", false);
}

async function updatePostState(id: string, action = "Pin") {
  eventBus.emit("main-loading", true);
  const _r = await rest(`ObelixBB/${action}/${id}`, "PATCH", {});
  if (_r && _r.result === "success") {
    eventBus.emit("reloadBB", true);
  }
  eventBus.emit("main-loading", false);
}

async function deletePost(id: string) {
  eventBus.emit("showConfirm", {
    title: "Are you sure you want to delete this post?",
    onConfirm: async () => {
      eventBus.emit("main-loading", true);
      const _r = await rest(`ObelixBB/Post/${id}`, "DELETE", {});
      if (_r && _r.result === "success") {
        if (!props.isSingle) {
          eventBus.emit("reloadBB", true);
        } else {
          eventBus.emit("main-loading", false);
          window.location.href = `/forums/${props.post.BoardUUID}`;
        }
      }
      eventBus.emit("main-loading", false);
    },
  });
}
const userMenu = ref();
const useMenuInstance = ref();
const userMenuButton = ref();
onMounted(() => {
  useMenuInstance.value = new Dropdown(userMenu.value, userMenuButton.value, {
    offsetDistance: -5,
  });
});
</script>

<template>
  <div
    class="gap-1 bb-container-base bb-data"
    :itemid="`/forums/${$route.params.uuid}/${post.Slug}`"
    itemscope
    itemtype="https://schema.org/DiscussionForumPosting"
  >
    <div
      class="flex-1 p-2"
      :class="{
        '': isSingle,
        '': !isSingle,
      }"
    >
      <div v-if="post.User.UUID === userID || isAdmin" class="float-right">
        <button
          ref="userMenuButton"
          type="button"
          class="open-top-menu group flex items-center justify-center gap-2"
        >
          <EllipsisVerticalIcon class="w-6 h-6" />
        </button>

        <div
          ref="userMenu"
          class="z-[20] hidden bg-white divide-y divide-fv-neutral-100 rounded-lg shadow w-44 dark:bg-fv-neutral-800 dark:divide-fv-neutral-600"
        >
          <ul
            class="py-2 text-sm text-fv-neutral-800 dark:text-fv-neutral-200"
            aria-labelledby="userMenu"
          >
            <li v-if="isAdmin">
              <button
                class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                @click.prevent="
                  () => {
                    updatePostState(post.ID, 'Pin');
                    useMenuInstance.value.hide();
                  }
                "
              >
                {{ post.IsPinned ? $t("bb_unpin_cta") : $t("bb_pin_cta") }}
              </button>
            </li>
            <li v-if="isAdmin">
              <button
                class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                @click.prevent="
                  () => {
                    updatePostState(post.ID, 'Lock');
                    useMenuInstance.value.hide();
                  }
                "
              >
                {{ post.IsLocked ? $t("bb_unlock_cta") : $t("bb_lock_cta") }}
              </button>
            </li>
            <li v-if="post.User.UUID === userID || isAdmin">
              <button
                class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                @click.prevent="
                  () => {
                    updatePostState(post.ID, 'NSFW');
                    useMenuInstance.value.hide();
                  }
                "
              >
                {{ post.IsNSFW ? $t("bb_unnsfw_cta") : $t("bb_nsfw_cta") }}
              </button>
            </li>
            <li v-if="post.User.UUID === userID || isAdmin">
              <button
                class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                @click.prevent="
                  () => {
                    updatePostState(post.ID, 'Spoiler');
                    useMenuInstance.value.hide();
                  }
                "
              >
                {{
                  post.IsSpoiler ? $t("bb_unspoiler_cta") : $t("bb_spoiler_cta")
                }}
              </button>
            </li>
            <li v-if="post.User.UUID === userID || isAdmin">
              <button
                class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                @click.prevent="
                  () => {
                    deletePost(post.ID);
                    useMenuInstance.value.hide();
                  }
                "
              >
                {{ $t("bb_delete_cta") }}
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex gap-2 justify-between">
        <div class="text-white/[.5] text-xs">
          Posted by
          <span
            itemprop="author"
            itemscope
            itemtype="https://schema.org/Person"
          >
            <b itemprop="name">@{{ post.User.Username }}</b>
          </span>
          on
          <time itemprop="datePublished" :datetime="post.CreatedAt.iso">{{
            $formatDate(post.CreatedAt.iso)
          }}</time
          >.
        </div>
        <div v-if="0" class="flex gap-2">
          <button
            v-if="post.User.UUID === userID || isAdmin"
            class="btn small primary"
            @click.prevent="updatePostState(post.ID)"
          >
            {{ post.IsPinned ? $t("bb_unpin_cta") : $t("bb_pin_cta") }}
          </button>
          <button
            v-if="post.User.UUID === userID || isAdmin"
            class="btn small danger"
            @click.prevent="deletePost(post.ID)"
          >
            {{ $t("bb_delete_cta") }}
          </button>
        </div>
      </div>
      <div class="flex gap-2 justify-between items-center">
        <RouterLink
          :to="`/forums/${$route.params.uuid}/${post.Slug}`"
          class="flex-1"
        >
          <component
            :is="isSingle ? 'h1' : 'h2'"
            :class="{
              'h1 -mt-0.5 flex  gap-2 items-center': isSingle,
              'h2 -mt-1 gap-2 items-center flex': !isSingle,
            }"
          >
            <span itemprop="headline">{{ post.Title }}</span>

            <div class="flex items-center gap-1">
              <span
                v-if="post.IsPinned"
                class="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
                >{{ $t("bb_post_pinned") }}</span
              >
              <span
                v-if="post.IsNSFW"
                class="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                >{{ $t("bb_post_nsfw") }}</span
              >
              <span
                v-if="post.IsSpoiler"
                class="bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                >{{ $t("bb_post_spoiler") }}</span
              >
              <span
                v-if="post.IsLocked"
                class="bg-orange-100 text-orange-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-orange-900 dark:text-orange-300"
                >{{ $t("bb_post_locked") }}</span
              >
            </div>
          </component>
        </RouterLink>
      </div>

      <div
        v-if="isSingle && post.PostType === 1"
        class="border-t mt-1 dark:border-t-white/[.1] border-fv-neutral-950/[.1]"
      >
        <div
          itemprop="articleBody"
          class="prose dark:prose-invert !max-w-full py-2 px-3"
          v-html="md.render(post.Message)"
        />
      </div>

      <div v-if="post.PostType === 3" itemprop="articleBody" class="mt-1 mb-3">
        <img
          v-if="post.LinkType === 'img'"
          :src="`https://s.nocachenocry.com/${post.LinkData}?vars=format=png:scale_crop_center=400x150`"
          class="rounded bg-cover bg-center cursor-pointer w-automb-2 shadow border-[3px] border-fv-neutral-600/[.5] dark:border-fv-neutral-300/[.5]"
          @click="
            () => {
              eventBus.emit('setZoomImageModal', {
                url: `https://s.nocachenocry.com/${post.LinkData}`,
                title: post.Title,
              });
            }
          "
        />
        <a
          v-if="post.LinkType === 'web'"
          :href="post.LinkData"
          target="_blank"
          rel="nofollow"
          class="text-xl inline-flex gap-1 items-center text-fv-accent-800 dark:text-fv-accent-400 underline hover:text-fv-accent-600 dark:hover:text-fv-accent-300"
        >
          <PaperClipIcon class="w-5 h-5" /> {{ post.LinkData }}
        </a>
        <iframe
          v-if="post.LinkType === 'yt'"
          style="width: 100%; max-width: 600px; aspect-ratio: 16/9"
          :src="`https://www.youtube.com/embed/${post.LinkData}`"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
        <button
          v-if="post.LinkType === 'web'"
          target="_blank"
          class="text-white underline"
          @click.prevent="
            (el) => {
              // @ts-ignore
              el.view.open(post.Message, '_blank');
            }
          "
        >
          {{ post.Message }}
        </button>
      </div>
      <div
        class="flex gap-2 items-center justify-start"
        :class="{
          'dark:border-t-white/[.1] border-fv-neutral-950/[.1] border-t pt-1 mt-2':
            isSingle,
        }"
      >
        <div class="flex flex-row gap-2 items-center">
          <button
            :class="{
              'text-green-500 cursor-auto': upvoted,
              'dark:text-white/[.5] text-fv-neutral-700/[.5] cursor-auto':
                downvoted,
            }"
            @click.prevent="
              () => {
                if (!upvoted && !downvoted) {
                  upvote(post.ID, 'upvote', 'post');
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
            {{ post.Score ? post.Score : 0 }}
          </div>
          <button
            :class="{
              'text-red-500 cursor-auto': downvoted,
              'dark:text-white/[.5] text-fv-neutral-700/[.5] cursor-auto':
                upvoted,
            }"
            @click.prevent="
              () => {
                if (!downvoted && !upvoted) {
                  upvote(post.ID, 'downvote', 'post');
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
        <div>•</div>
        <RouterLink
          :to="`/forums/${$route.params.uuid}/${post.Slug}#replies`"
          class="flex gap-2 items-center justify-between"
        >
          <div
            class="flex text-sm items-center gap-2 text-white"
            itemprop="interactionStatistic"
            itemscope
            itemtype="https://schema.org/InteractionCounter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-4 h-4"
            >
              <path
                fill-rule="evenodd"
                d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z"
                clip-rule="evenodd"
              />
            </svg>
            <link
              itemprop="interactionType"
              href="https://schema.org/CommentAction"
            />

            <span itemprop="userInteractionCount"
              >{{
                $t("bb_comment", {
                  count: post.ReplyCount ? post.ReplyCount : 0,
                })
              }}
            </span>
          </div>
        </RouterLink>
      </div>
      <div v-if="isSingle" class="px-2 mt-4">
        <BBReply v-if="isSingle" :post="post" :posts="posts" />

        <BBReplies :post="post" />
      </div>
    </div>
  </div>
</template>
