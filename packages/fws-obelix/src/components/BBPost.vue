<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useEventBus, useRest, useUserStore } from "@fy-/fws-vue";
import { getRealm } from "@fy-/fws-js";
import { RouterLink } from "vue-router";
import markdownit from "markdown-it";
import { Dropdown } from "flowbite";
import {
  UserIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
} from "@heroicons/vue/24/solid";
import BBReply from "./BBReply.vue";
import BBReplies from "./BBReplies.vue";
import { useBBStore } from "./bbStore";

const md = markdownit();

const props = withDefaults(
  defineProps<{
    post: any;
    posts: any;
    isSingle?: boolean;
    avatarComponent: any;
    rankComponent?: any;
    idx?: number;
    total?: number;
    imgDomain?: string;
  }>(),
  {
    isSingle: false,
    rankComponent: () => null,
    idx: 0,
    total: 0,
    imgDomain: "https://s.nocachenocry.com",
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
const mounted = ref(false);
watch(isAuth, () => {
  if (isAuth.value && mounted.value && props.isSingle) {
    useMenuInstance.value = new Dropdown(userMenu.value, userMenuButton.value, {
      offsetDistance: -5,
    });
  }
});
onMounted(() => {
  mounted.value = true;
  if (isAuth.value && props.isSingle) {
    useMenuInstance.value = new Dropdown(userMenu.value, userMenuButton.value, {
      offsetDistance: -5,
    });
  }
});
</script>

<template>
  <component
    :is="isSingle ? 'article' : RouterLink"
    :to="isSingle ? undefined : `/forums/${$route.params.uuid}/${post.Slug}`"
    class="gap-1 bb-container-base !rounded-none block"
    :itemid="`/forums/${$route.params.uuid}/${post.Slug}`"
    itemscope
    itemtype="https://schema.org/DiscussionForumPosting"
    :class="{
      '!border-b-0': !isSingle && idx !== total,
      'bb-data': !isSingle,
    }"
  >
    <template v-if="isSingle">
      <h1
        class="h1 px-2 lg:px-1 mt-5 flex flex-col lg:flex-row justify-between gap-2 lg:items-center"
      >
        <span itemprop="headline" class="flex-1 w-full">{{ post.Title }}</span>

        <div class="flex justify-between items-center gap-4">
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
          <div
            v-if="isAuth && (post.User.UUID === userID || isAdmin)"
            class="flex items-center justify-end"
          >
            <button
              ref="userMenuButton"
              :id="`userMenuButton_${post.ID}`"
              type="button"
              class="open-top-menu group flex items-center justify-center gap-2"
            >
              <EllipsisVerticalIcon class="w-6 h-6" />
            </button>

            <div
              ref="userMenu"
              :id="`userMenu_${post.ID}`"
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
                        useMenuInstance.hide();
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
                        useMenuInstance.hide();
                      }
                    "
                  >
                    {{
                      post.IsLocked ? $t("bb_unlock_cta") : $t("bb_lock_cta")
                    }}
                  </button>
                </li>
                <li v-if="post.User.UUID === userID || isAdmin">
                  <button
                    class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                    @click.prevent="
                      () => {
                        updatePostState(post.ID, 'NSFW');
                        useMenuInstance.hide();
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
                        useMenuInstance.hide();
                      }
                    "
                  >
                    {{
                      post.IsSpoiler
                        ? $t("bb_unspoiler_cta")
                        : $t("bb_spoiler_cta")
                    }}
                  </button>
                </li>
                <li v-if="post.User.UUID === userID || isAdmin">
                  <button
                    class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                    @click.prevent="
                      () => {
                        $router.push(
                          `/forums/${post.BoardUUID}/new?edit=${post.Slug}`,
                        );
                        useMenuInstance.hide();
                      }
                    "
                  >
                    {{ $t("bb_edit_cta") }}
                  </button>
                </li>
                <li v-if="post.User.UUID === userID || isAdmin">
                  <button
                    class="flex items-center gap-2 whitespace-nowrap w-full px-4 py-2 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 dark:hover:text-white"
                    @click.prevent="
                      () => {
                        deletePost(post.ID);
                        useMenuInstance.hide();
                      }
                    "
                  >
                    {{ $t("bb_delete_cta") }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </h1>

      <div class="flex flex-col lg:flex-row gap-2 bb-data !rounded-none mt-3">
        <div
          class="w-full p-2 lg:flex flex-col gap-4 lg:items-center lg:w-44 lg:flex-0 lg:shrink-0 lg:grow-0 border-0 border-b lg:border-b-0 lg:border-r border-fv-neutral-200 dark:border-fv-neutral-800"
        >
          <component
            :is="avatarComponent"
            :name="
              post.User?.UserProfile?.Username
                ? post.User.UserProfile.Username
                : post.User.UUID
            "
            :user="post.User"
            class="w-16 h-16 lg:w-28 lg:h-28 shrink-0 grow-0 float-left lg:float-none mr-4 lg:mr-0"
            cls="w-16 h-16 lg:w-28 lg:h-28 shrink-0 grow-0 float-left lg:float-none mr-4 lg:mr-0"
          />
          <div
            itemprop="author"
            itemscope
            itemtype="https://schema.org/Person"
            class="text-2xl flex-0 grow-0"
          >
            <b itemprop="name"
              >@{{
                post.User?.UserProfile?.Username
                  ? post.User.UserProfile.Username
                  : "Anonymous"
              }}</b
            >
          </div>
          <component :is="rankComponent" :user="post.User" />
          <div
            class="flex gap-2 lg:w-full lg:flex-col justify-start mt-2 lg:mt-0 lg:justify-start items-center text-xs lg:text-sm"
          >
            <div class="flex gap-2 lg:w-full justify-start items-center">
              <ChatBubbleLeftRightIcon class="w-4 h-4" />
              {{
                $t("bb_user_messages", { count: post.User.ForumsMessagesCount })
              }}
            </div>
            <div class="flex gap-2 lg:w-full justify-start items-center">
              <ChatBubbleLeftRightIcon class="w-4 h-4" />
              {{ $t("bb_user_likes", { count: post.User.ForumsLikesCount }) }}
            </div>
            <div class="flex gap-2 lg:w-full justify-start items-center">
              <UserIcon class="w-4 h-4" />
              {{ $formatDate(post.User.CreatedAt.iso) }}
            </div>
          </div>
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div v-if="post.PostType === 1" class="flex-1">
            <div
              itemprop="articleBody"
              class="prose dark:prose-invert !max-w-full py-2 px-3"
              v-html="md.render(post.Message)"
            />
          </div>
          <div
            v-if="post.PostType === 3"
            itemprop="articleBody"
            class="mt-1 mb-3 flex-1"
          >
            <img
              v-if="post.LinkType === 'img'"
              :src="`${imgDomain}/${post.LinkData}?vars=format=png:scale_ratio=1000x500`"
              :alt="post.Title"
              :title="post.Title"
              class="rounded bg-cover bg-center cursor-pointer w-automb-2 shadow border-[3px] border-fv-neutral-600/[.5] dark:border-fv-neutral-300/[.5]"
              @click="
                () => {
                  eventBus.emit('setZoomImageModal', {
                    url: `${imgDomain}/${post.LinkData}`,
                    title: post.Title,
                  });
                }
              "
            />
            <div
              v-if="post.LinkType === 'web'"
              class="flex flex-col justify-center items-center h-full"
            >
              <a
                :href="post.LinkData"
                target="_blank"
                rel="nofollow"
                :title="post.Title"
                class="text-2xl inline-flex gap-1 items-center text-fv-accent-800 dark:text-fv-accent-400 underline hover:text-fv-accent-600 dark:hover:text-fv-accent-300"
              >
                <PaperClipIcon class="w-5 h-5" />
                {{ $cropText(post.LinkData, 60) }}
              </a>
            </div>
            <div class="flex-1" v-if="post.LinkType === 'yt'">
              <iframe
                style="width: 100%; max-width: 600px; aspect-ratio: 16/9"
                :src="`https://www.youtube.com/embed/${post.LinkData}`"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
          </div>

          <div
            class="flex gap-2 items-center justify-end px-3 pt-2 pb-1.5 flex-0"
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
                class="flex text-sm items-center gap-2 dark:text-white text-black"
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
        </div>
      </div>
      <h2 class="h3 px-1 mt-5">
        {{
          $t("bb_comment", {
            count: post.ReplyCount ? post.ReplyCount : 0,
          })
        }}
      </h2>
      <div v-if="isSingle" class="px-2 bb-data !rounded-none mt-3">
        <BBReply v-if="isSingle" :post="post" :posts="posts" />

        <BBReplies :post="post" />
      </div>
    </template>
    <template v-else>
      <div class="flex gap-2 items-center py-1.5">
        <div class="flex items-center justify-center pl-3 pr-1">
          <component
            :is="avatarComponent"
            :name="
              post.User?.UserProfile?.Username
                ? post.User.UserProfile.Username
                : post.User.UUID
            "
            :user="post.User"
            class="w-10 h-10 shrink-0 grow-0"
          />
        </div>
        <div class="grow-1 flex-1">
          <RouterLink
            :to="`/forums/${$route.params.uuid}/${post.Slug}`"
            class="flex-1"
          >
            <component
              :is="isSingle ? 'h1' : 'h2'"
              :class="{
                'h2 flex  gap-2 items-center !text-left': isSingle,
                'h3 gap-2 items-center flex ': !isSingle,
              }"
            >
              <span itemprop="headline">{{ post.Title }}</span>

              <div class="hidden lg:flex items-center gap-1">
                <span
                  v-if="post.IsPinned"
                  class="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300"
                  >{{ $t("bb_post_pinned") }}</span
                >
                <span
                  v-if="post.IsNSFW"
                  class="bg-red-100 text-pink-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-pink-900 dark:text-pink-300"
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
                <span
                  v-if="post.LinkType === 'yt'"
                  class="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
                  >Youtube</span
                >
                <span
                  v-if="post.LinkType === 'img'"
                  class="bg-red-100 text-cyan-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-cyan-900 dark:text-cyan-300"
                  >Image</span
                >
                <a
                  v-if="post.LinkType === 'web'"
                  :href="post.LinkData"
                  target="_blank"
                  rel="nofollow"
                  :title="post.Title"
                  class="text-base inline-flex gap-1 items-center text-fv-accent-800 dark:text-fv-accent-400 underline hover:text-fv-accent-600 dark:hover:text-fv-accent-300"
                >
                  <PaperClipIcon class="w-5 h-5" />
                  {{ $cropText(post.LinkData, 19) }}
                </a>
              </div>
            </component>
          </RouterLink>
          <div class="mt-0">
            <div class="text-white/[.5] text-xs">
              Posted by
              <span
                itemprop="author"
                itemscope
                itemtype="https://schema.org/Person"
              >
                <b itemprop="name"
                  >@{{
                    post.User?.UserProfile?.Username
                      ? post.User.UserProfile.Username
                      : "Anonymous"
                  }}</b
                >
              </span>
              on
              <time itemprop="datePublished" :datetime="post.CreatedAt.iso">{{
                $formatDate(post.CreatedAt.iso)
              }}</time
              >.
            </div>
          </div>
        </div>
        <div
          class="flex-row gap-2 items-center shrink-0 grow-0 px-4 hidden lg:flex"
        >
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
        <div>
          <RouterLink
            :to="`/forums/${$route.params.uuid}/${post.Slug}#replies`"
            class="gap-2 items-center justify-between shrink-0 grow-0 px-4 hidden lg:flex"
          >
            <div
              class="flex text-sm items-center gap-2 text-fv-neutral-600 dark:text-fv-neutral-500"
            >
              <EyeIcon class="w-4 h-4" />
              <span
                >{{
                  $t("bb_view", {
                    count: post.PostViews ? post.PostViews : 0,
                  })
                }}
              </span>
            </div>
          </RouterLink>
          <RouterLink
            :to="`/forums/${$route.params.uuid}/${post.Slug}#replies`"
            class="gap-2 items-center justify-between shrink-0 grow-0 px-4 hidden lg:flex"
          >
            <div
              class="flex text-sm items-center gap-2 text-fv-neutral-600 dark:text-fv-neutral-500"
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
        <div class="hidden lg:flex gap-4 items-center pr-3 w-44">
          <div v-if="post.LastReplyID" class="text-sm">
            {{ $formatTimeago(post.LastReply.CreatedAt.unixms) }}<br />
            @{{
              post.LastReply.User?.UserProfile?.Username
                ? post.LastReply.User.UserProfile.Username
                : "Anonymous"
            }}
          </div>
          <component
            :is="avatarComponent"
            v-if="post.LastReplyID"
            :name="
              post.LastReply.User?.UserProfile?.Username
                ? post.LastReply.User.UserProfile.Username
                : post.LastReply.User.UUID
            "
            :user="post.LastReply.User"
            class="w-10 h-10"
            cls="w-10 h-10"
          />
          <div
            v-if="!post.LastReplyID"
            class="text-fv-neutral-600 dark:text-fv-neutral-500"
          >
            n/a
          </div>
        </div>
      </div>
    </template>
  </component>
</template>
