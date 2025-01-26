<script setup lang="ts">
import {
  DefaultBreadcrumb,
  DefaultInput,
  useEventBus,
  useRest,
  useTranslation,
  useUserStore,
} from '@fy-/fws-vue'
import useVuelidate from '@vuelidate/core'
import { maxLength, minLength, required } from '@vuelidate/validators'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// import { MdEditor } from "md-editor-v3";

const posts = ref()
const is404 = ref(false)
const route = useRoute()

const state = reactive({
  post: {
    Title: '',
    Message: '',
    IsNSFW: false,
    IsSpoiler: false,
    Type: 'post',
  },
  link: {
    Title: '',
    Message: '',
    IsNSFw: false,
    IsSpoiler: false,
    Type: 'link',
  },
})
const rules = {
  post: {
    Title: { required, minLength: minLength(4), maxLength: maxLength(100) },
    Message: { required, minLength: minLength(4) },
  },
  link: {
    Title: { required, minLength: minLength(3), maxLength: maxLength(100) },
    Message: { required, minLength: minLength(3) },
  },
}
const v$ = useVuelidate(rules, state)
const currentEditID = ref()
const eventBus = useEventBus()
const store = useUserStore()
const currentType = ref('post')
const isAuth = computed(() => store.isAuth)
const router = useRouter()
const rest = useRest()
async function getPosts() {
  eventBus.emit('main-loading', true)
  const data = await rest(`ObelixBB/${route.params.uuid.toString()}`, 'GET')
  if (data && data.result === 'success') {
    posts.value = data.data
  }
  else {
    is404.value = true
  }

  eventBus.emit('main-loading', false)
}
await getPosts()
async function getEditPost() {
  eventBus.emit('main-loading', true)

  const data = await rest(
    `ObelixBB/${route.params.uuid.toString()}/Post/${route.query.edit}`,
    'GET',
  ).catch(() => {
    eventBus.emit('main-loading', false)
    router.push(`/forums/${route.params.uuid}`)
  })
  if (data && data.result === 'success') {
    if (data.data.Post.PostType !== 1) {
      eventBus.emit('main-loading', false)
      router.push(`/forums/${route.params.uuid}`)
    }
    state.post.Title = data.data.Post.Title
    state.post.Message = data.data.Post.Message
    currentEditID.value = data.data.Post.ID
  }
  else {
    eventBus.emit('main-loading', false)
    router.push(`/forums/${route.params.uuid}`)
  }
  eventBus.emit('main-loading', false)
}

if (route.query.edit) {
  getEditPost()
}
function openPostBB() {
  if (!isAuth.value) {
    router.push(`/login?return_to=/forums/${route.params.uuid}`)
  }
  else {
    eventBus.emit('postBBModal', true)
  }
}
async function post() {
  if (await v$.value[currentType.value].$validate()) {
    if (currentType.value === 'post') {
      if (!route.query.edit) {
        const res = await rest(`ObelixBB/${route.params.uuid}`, 'POST', {
          Title: state.post.Title,
          Message: state.post.Message,
          IsNSFW: state.post.IsNSFW,
          IsSpoiler: state.post.IsSpoiler,
          PostTypeStr: state.post.Type,
        })
        if (res && res.result === 'success') {
          state.post.Title = ''
          state.post.Message = ''
          state.post.IsNSFW = false
          state.post.IsSpoiler = false
          v$.value.post.$reset()
          eventBus.emit('postBBModal', false)
          eventBus.emit('reloadBB')
          router.push(`/forums/${route.params.uuid}/${res.data.Post.Slug}`)
        }
      }
      else {
        const res = await rest(
          `ObelixBB/_Patch/${route.params.uuid}`,
          'PATCH',
          {
            Title: state.post.Title,
            Message: state.post.Message,
            ID: currentEditID.value,
          },
        )

        if (res && res.result === 'success') {
          state.post.Title = ''
          state.post.Message = ''
          state.post.IsNSFW = false
          state.post.IsSpoiler = false
          v$.value.post.$reset()
          eventBus.emit('postBBModal', false)
          eventBus.emit('reloadBB')
          router.push(`/forums/${route.params.uuid}/${res.data.Slug}`)
        }
      }
    }
    if (currentType.value === 'link') {
      const res = await rest(`ObelixBB/${route.params.uuid}`, 'POST', {
        Title: state.link.Title,
        Message: state.link.Message,
        IsNSFW: state.link.IsNSFw,
        SpoilIsSpoilerer: state.link.IsSpoiler,
        PostTypeStr: state.link.Type,
      })
      if (res && res.result === 'success') {
        state.link.Title = ''
        state.link.Message = ''
        state.link.IsNSFw = false
        state.link.IsSpoiler = false
        v$.value.link.$reset()
        eventBus.emit('postBBModal', false)
        eventBus.emit('reloadBB')
        router.push(`/forums/${route.params.uuid}/${res.data.Post.Slug}`)
      }
    }
  }
}
onMounted(() => {
  eventBus.on('openPostBB', openPostBB)
})
onUnmounted(() => {
  eventBus.off('openPostBB', openPostBB)
})
function checkVuelidate(err: any[]): string {
  if (err && err.length > 0) {
    const e = `bb_vuelidate_validator_${err[0].$validator.toString()}`
    return translate(e)
  }
  return ''
}
const translate = useTranslation()
const nav = computed(() => {
  return [
    { name: translate('bb_home_bc'), to: '/forums' },
    { name: posts.value.Board.Name },
  ]
})
</script>

<template>
  <div v-if="posts && posts.Board && !is404">
    <div class="bb-container-base flex shadow flex-col bb-kik mt-4">
      <div class="px-2 mb-1">
        <DefaultBreadcrumb :nav="nav" :show-home="false" />
      </div>
    </div>
    <div class="bb-kik mt-4">
      <div v-if="!$route.query.edit" class="flex">
        <button
          class="w-1/2 p-2 flex items-center justify-center gap-1"
          :class="{
            'dark:border-b-white/[.6] text-fv-neutral-500 dark:text-white/[.6] border-b':
              currentType !== 'post',
            'border-b-fv-neutral-700 text-fv-neutral-700 border-b-2  font-bold dark:border-b-fv-neutral-200 dark:text-fv-neutral-200':
              currentType === 'post',
          }"
          type="button"
          @click="currentType = 'post'"
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          {{ $t("bb_post_type_cta") }}
        </button>

        <button
          class="w-1/2 p-2 flex items-center justify-center gap-1"
          :class="{
            'dark:border-b-white/[.6] text-fv-neutral-500 dark:text-white/[.6] border-b':
              currentType !== 'link',
            'border-b-fv-neutral-700 text-fv-neutral-700 border-b-2 font-bold dark:border-b-fv-neutral-200 dark:text-fv-neutral-200':
              currentType === 'link',
          }"
          @click="currentType = 'link'"
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
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
          {{ $t("bb_link_type_cta") }}
        </button>
      </div>
      <form v-if="currentType === 'post'" class="p-4" @submit.prevent="post">
        <div
          class="mb-2"
          v-html="$t('bb_posting_on', { forum: posts.Board.Name })"
        />
        <DefaultInput
          id="title"
          v-model="state.post.Title"
          :error-vuelidate="v$.post.Title.$errors"
          :label="$t('bb_title_label')"
          :placeholder="$t('bb_title_placeholder')"
          class="mb-2"
        />

        <DefaultInput
          id="message"
          v-model="state.post.Message"
          :error-vuelidate="v$.post.Message.$errors"
          :label="$t('bb_message_label')"
          :help="$t('bb_message_help')"
          :placeholder="$t('bb_message_placeholder')"
          type="textarea"
          class="mb-2 bb-high"
        />

        <!-- <MdEditor
          v-model="state.post.Message"
          :theme="mode"
          language="en-US"
          :toolbars-exclude="[
            'codeRow',
            'code',
            'image',
            'mermaid',
            'katex',
            'save',
            'catalog',
            'github',
            'task',
            'htmlPreview',
          ]"
          :no-upload-img="true"
        /> -->

        <div
          v-if="checkVuelidate(v$.post.Message.$errors)"
          class="text-red-500 text-xs font-bold py-1 px-2"
        >
          {{ $t(checkVuelidate(v$.post.Message.$errors)) }}
        </div>

        <DefaultInput
          v-if="0"
          id="message"
          v-model="state.post.Message"
          :error-vuelidate="v$.post.Message.$errors"
          :label="$t('bb_message_label')"
          :placeholder="$t('bb_message_placeholder')"
          type="textarea"
          class="mb-2 btr"
        />
        <div
          v-if="!$route.query.edit"
          class="flex items-end justify-start gap-3 mt-3"
        >
          <div>
            <DefaultInput
              id="isNSFW"
              v-model:checkbox-value="state.post.IsNSFW"
              type="toggle"
              :label="$t('bb_is_nsfw')"
            />
          </div>
          <div>
            <DefaultInput
              id="isSpoiler"
              v-model:checkbox-value="state.post.IsSpoiler"
              type="toggle"
              :label="$t('bb_is_spoiler')"
            />
          </div>
        </div>
        <div class="flex items-center justify-center">
          <button type="submit" class="btn primary medium">
            {{ $t("bb_post_cta") }}
          </button>
        </div>
      </form>
      <form v-if="currentType === 'link'" class="p-4" @submit.prevent="post">
        <div
          class="mb-2"
          v-html="$t('bb_posting_on', { forum: posts.Board.Name })"
        />
        <DefaultInput
          id="title"
          v-model="state.link.Title"
          :error-vuelidate="v$.link.Title.$errors"
          :label="$t('bb_title_label')"
          placeholder="..."
          class="mb-2"
        />
        <DefaultInput
          id="message"
          v-model="state.link.Message"
          :error-vuelidate="v$.link.Message.$errors"
          :label="$t('bb_link_label')"
          placeholder="https://youtube.com/xxx, https://i.imgur.com/xxx.png, etc..."
          type="text"
          class="mb-2"
        />
        <div class="flex items-end justify-start gap-3 mt-3">
          <DefaultInput
            id="isNSFW"
            v-model:checkbox-value="state.link.IsNSFw"
            type="toggle"
            :label="$t('bb_is_nsfw')"
          />
          <DefaultInput
            id="isSpoiler"
            v-model:checkbox-value="state.link.IsSpoiler"
            type="toggle"
            :label="$t('bb_is_spoiler')"
          />
        </div>
        <div class="flex items-center justify-between">
          <button type="submit" class="btn primary defaults">
            {{ $t("bb_post_cta") }}
          </button>
          <button
            type="reset"
            class="btn neutral defaults"
            @click="() => eventBus.emit('postBBModal', false)"
          >
            {{ $t("bb_cancel_cta") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
