<script setup lang="ts">
import {
  DefaultInput,
  DefaultModal,
  DefaultPaging,
  useEventBus,
  useRest,
} from '@fy-/fws-vue'

import useVuelidate from '@vuelidate/core'
import { maxLength, minLength, required } from '@vuelidate/validators'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBBStore } from './bbStore'

const eventBus = useEventBus()
const wStore = useBBStore()
const upvoted = computed(() => wStore.ForumsUpvotesComment)
const downvoted = computed(() => wStore.ForumsDownvotesComment)
const rest = useRest()

const props = withDefaults(
  defineProps<{
    post: any
    childs?: any
    avatarComponent: any
    rankComponent?: any
  }>(),
  {
    childs: null,
    rankComponent: () => null,
  },
)
const replies = ref()
const paging = ref()
const route = useRoute()
const repliesOpen = ref({})
const inReplyTo = ref(null)
const state = reactive({
  reply: {
    Message: '',
  },
})
const rules = {
  reply: {
    Message: { required, minLength: minLength(3), maxLength: maxLength(1000) },
  },
}
const v$ = useVuelidate(rules, state)
const router = useRouter()
async function postReply() {
  if (await v$.value.reply.$validate()) {
    eventBus.emit('main-loading', true)
    const data = await rest(`ObelixBB/Reply/${props.post.Slug}`, 'POST', {
      Message: state.reply.Message,
      InReplyTo: inReplyTo.value ? Number.parseInt(inReplyTo.value) : null,
      PostId: props.post.ID,
    })
    if (data && data.result === 'success') {
      eventBus.emit('reloadBB', true)
      eventBus.emit('replyToModal', false)
      state.reply.Message = ''
      v$.value.reply.$reset()
      router.push({
        query: { page: paging.value?.page_max ? paging.value?.page_max : 1 },
        hash: `bbreplies-${data.data.ID}`,
      })
    }
    eventBus.emit('main-loading', false)
  }
}

async function getReplies(page = 1) {
  eventBus.emit('main-loading', true)
  repliesOpen.value = {}
  replies.value = undefined
  if (route.query.page) page = Number.parseInt(route.query.page as string)

  const data = await rest(
    `ObelixBB/${props.post.BoardUUID}/RepliesClassic/${props.post.Slug}`,
    'GET',
    {
      results_per_page: 10,
      page_no: page,
    },
  ).catch(() => {
    replies.value = []
    eventBus.emit('main-loading', false)
  })
  if (data && data.result === 'success') {
    replies.value = data.data
    paging.value = data.paging
  }
  else {
    replies.value = []
  }
  eventBus.emit('main-loading', false)
}

async function upvote(id: string, type = 'upvote', object = 'post') {
  eventBus.emit('main-loading', true)
  const _r = await rest(`ObelixBB/Vote/${type}/${object}/${id}`, 'POST', {})
  if (_r && _r.result === 'success') {
    eventBus.emit('reloadBB', true)
    eventBus.emit('refreshBBProfile', true)
  }
  eventBus.emit('main-loading', false)
}

onMounted(async () => {
  if (props.childs === null) {
    await getReplies()
  }
  else {
    replies.value = props.childs
  }
  eventBus.on('reloadBB', getReplies)
  eventBus.on('bbrepliesGoToPage', getReplies)
})

onUnmounted(() => {
  eventBus.off('reloadBB', getReplies)
  eventBus.off('bbrepliesGoToPage', getReplies)
})
</script>

<template>
  <div class="mt-2">
    <div class="mt-2 justify-between gap-2 items-center flex mb-2">
      <div>
        {{
          $t("bb_comment", {
            count: post.ReplyCount ? post.ReplyCount : 0,
          })
        }}
      </div>
      <button
        v-if="!props.post.IsLocked"
        class="btn primary defaults !mb-0"
        @click="
          () => {
            inReplyTo = null;
            $eventBus.emit('replyToModal', true);
          }
        "
      >
        {{ $t("bb_reply_cta") }}
      </button>
    </div>
    <template v-if="post.IsLocked">
      <div
        class="bg-fv-neutral-100 text-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-200 p-2 rounded-lg mb-2"
      >
        {{ $t("bb_locked_msg_info") }}
      </div>
    </template>
    <template v-if="replies && replies.length === 0">
      <div
        class="bg-fv-neutral-100 text-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-200 p-2 rounded-lg mb-2"
      >
        {{ $t("bb_no_replies_yet") }}
      </div>
    </template>
    <DefaultModal id="replyTo">
      <form @submit.prevent="postReply">
        <DefaultInput
          id="reply_to_form"
          v-model="state.reply.Message"
          :error-vuelidate="v$.reply.Message.$errors"
          placeholder="What are your thoughts?"
          type="textarea"
          class="mb-2 mt-4 bti"
        />
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            class="btn neutral small"
            @click="
              () => {
                inReplyTo = null;
                $eventBus.emit('replyToModal', false);
              }
            "
          >
            {{ $t("bb_cancel") }}
          </button>
          <button type="submit" class="btn primary small px-3 float-right">
            {{ $t("bb_reply_cta") }}
          </button>
        </div>
      </form>
    </DefaultModal>
    <template v-if="replies && replies.length">
      <div
        v-for="reply in replies"
        :id="`bbreplies-${post.ID}`"
        :key="`${reply.ID}-${post.ID}-${reply.Depth}`"
        itemprop="comment"
        itemscope
        itemtype="http://schema.org/Comment"
      >
        <div
          class="flex flex-col lg:flex-row gap-2 bb-data !rounded-none mb-[3px]"
        >
          <div
            class="w-full p-2 lg:flex flex-col gap-4 lg:items-center lg:w-44 lg:flex-0 lg:shrink-0 lg:grow-0 border-0 border-b lg:border-b-0 lg:border-r border-fv-neutral-200 dark:border-fv-neutral-800"
          >
            <component
              :is="avatarComponent"
              :name="
                reply.User?.UserProfile?.Username
                  ? reply.User.UserProfile.Username
                  : reply.User.UUID
              "
              :user="reply.User"
              class="w-12 h-12 lg:w-16 lg:h-16 shrink-0 grow-0 float-left lg:float-none mr-4 lg:mr-0"
              cls="w-12 h-12 lg:w-16 lg:h-16 shrink-0 grow-0 float-left lg:float-none mr-4 lg:mr-0"
            />
            <div
              itemprop="author"
              itemscope
              itemtype="https://schema.org/Person"
              class="text-xl flex-0 grow-0"
            >
              <b itemprop="name">@{{
                reply.User?.UserProfile?.Username
                  ? $cropText(reply.User.UserProfile.Username, 14)
                  : "Anonymous"
              }}</b>
            </div>
          </div>
          <div class="flex-1 flex flex-col justify-between py-2">
            <div
              itemprop="text"
              class="text-fv-neutral-300 px-2 prose dark:prose-invert"
            >
              <blockquote
                v-if="reply.ReplyInReplyTo && reply.ReplyInReplyTo.ID"
                class="!mb-3"
              >
                {{ reply.ReplyInReplyTo.Message }}
                <footer>
                  <small>by
                    {{
                      reply.ReplyInReplyTo.User?.UserProfile?.Username
                        ? reply.ReplyInReplyTo.User.UserProfile.Username
                        : "Anonymous"
                    }}
                    -
                    <time
                      itemprop="dateCreated"
                      :datetime="reply.ReplyInReplyTo.CreatedAt.iso"
                    >{{
                      $formatDate(reply.ReplyInReplyTo.CreatedAt.iso)
                    }}</time>
                  </small>
                </footer>
              </blockquote>
              {{ reply.Message }}
            </div>

            <div
              class="flex items-center justify-between px-2 mt-1 gap-1 border-t border-fv-neutral-200 dark:border-fv-neutral-800 pt-1.5"
            >
              <div
                class="text-fv-neutral-700 dark:text-fv-neutral-300 italic text-sm"
              >
                <time itemprop="dateCreated" :datetime="reply.CreatedAt.iso">{{
                  $formatDatetime(reply.CreatedAt.iso)
                }}</time>.
              </div>
              <div class="flex items-center gap-x-2 text-fv-neutral-400">
                <button
                  :class="{
                    'text-green-500 cursor-auto': upvoted.includes(reply.ID),
                    'text-fv-neutral-500 cursor-auto': downvoted.includes(
                      reply.ID,
                    ),
                  }"
                  @click="
                    () => {
                      if (
                        !upvoted.includes(reply.ID)
                        && !downvoted.includes(reply.ID)
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
                    'text-fv-neutral-500 cursor-auto': upvoted.includes(
                      reply.ID,
                    ),
                  }"
                  @click="
                    () => {
                      if (
                        !downvoted.includes(reply.ID)
                        && !upvoted.includes(reply.ID)
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
              <div v-if="post.IsLocked === false">
                <button
                  class="btn primary defaults"
                  @click="
                    () => {
                      inReplyTo = reply.ID;
                      $eventBus.emit('replyToModal', true);
                    }
                  "
                >
                  {{ $t("bb_quote_cta") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="flex items-center justify-end mt-2">
      <DefaultPaging
        v-if="paging"
        id="bbreplies"
        hash="replies"
        :items="paging"
      />
    </div>
  </div>
</template>
