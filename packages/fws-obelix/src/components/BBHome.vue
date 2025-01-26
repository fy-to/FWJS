<script setup lang="ts">
import {
  DefaultBreadcrumb,
  DefaultPaging,
  useEventBus,
  useRest,
  useSeo,
  useTranslation,
} from '@fy-/fws-vue'
import { useLocalStorage } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BBFooter from './BBFooter.vue'
import BBPost from './BBPost.vue'

const props = withDefaults(
  defineProps<{
    notFoundPage: any
    isSingle?: boolean
    avatarComponent: any
    imgDomain?: string
    rankComponent?: any
  }>(),
  {
    isSingle: false,
    imgDomain: 'https://s.nocachenocry.com',
    rankComponent: () => null,
  },
)

const rest = useRest()
const route = useRoute()
const eventBus = useEventBus()
const posts = ref()
const order = useLocalStorage('bb_order', 't')
const is404 = ref(false)
const paging = ref()
async function getPosts(page = 1) {
  eventBus.emit('main-loading', true)
  is404.value = false
  if (route.query.page) page = Number.parseInt(route.query.page as string)

  if (!props.isSingle && route.params.uuid) {
    const data = await rest(
      `ObelixBB/${route.params.uuid.toString()}/${order.value}`,
      'GET',
      {
        results_per_page: 15,
        page_no: page,
      },
    ).catch(() => {
      is404.value = true
      eventBus.emit('main-loading', false)
    })
    if (data && data.result === 'success') {
      posts.value = data.data
      paging.value = data.paging
    }
    else {
      is404.value = true
    }
  }
  else if (props.isSingle && route.params.uuid && route.params.slug) {
    const data = await rest(
      `ObelixBB/${route.params.uuid.toString()}/Post/${route.params.slug}`,
      'GET',
    ).catch(() => {
      is404.value = true
      eventBus.emit('main-loading', false)
    })
    if (data && data.result === 'success') {
      posts.value = data.data
    }
    else {
      is404.value = true
    }
  }

  eventBus.emit('main-loading', false)
}

await getPosts()
const mounted = ref(false)

onMounted(() => {
  if (!mounted.value) {
    mounted.value = true
  }
  eventBus.on('reloadBB', getPosts)
  eventBus.on('bbpostsGoToPage', getPosts)
})
onUnmounted(() => {
  eventBus.off('reloadBB', getPosts)
  eventBus.off('bbpostsGoToPage', getPosts)
})

watch(
  () => [route.params.uuid, order.value],
  () => {
    if (mounted.value && route.params.uuid) {
      getPosts()
    }
  },
)

useSeo(
  ref({
    title: computed(() => {
      if (props.isSingle) {
        return `${posts.value?.Post?.Title} - ${posts.value?.Board?.Name}`
      }
      return `${posts.value?.Board?.Name} - Forums`
    }),
    description: computed(() => {
      if (!props.isSingle) {
        return posts.value?.Board?.Description
      }
      return undefined
    }),
  }),
)
const translate = useTranslation()
const nav = computed(() => {
  if (props.isSingle) {
    return [
      { name: translate('bb_home_bc'), to: '/forums' },
      { name: posts.value.Board.Name, to: `/forums/${posts.value.Board.UUID}` },
      { name: posts.value.Post.Title },
    ]
  }
  return [
    { name: translate('bb_home_bc'), to: '/forums' },
    { name: posts.value.Board.Name },
  ]
})
</script>

<template>
  <div>
    <template v-if="posts && !is404">
      <template v-if="isSingle">
        <div class="bb-container-base flex shadow flex-col bb-kik">
          <div class="px-2 mb-1">
            <DefaultBreadcrumb :nav="nav" :show-home="false" />
          </div>
        </div>
        <BBPost
          :post="posts.Post"
          :is-single="true"
          :posts="posts.Replies"
          :avatar-component="avatarComponent"
          :rank-component="rankComponent"
          :img-domain="imgDomain"
        />
      </template>
      <template v-else>
        <div class="bb-container-base flex shadow flex-col bb-kik">
          <div class="px-2 mb-1">
            <DefaultBreadcrumb :nav="nav" :show-home="false" />
          </div>
        </div>
        <div class="bb-container-base mt-2">
          <div class="px-1">
            <h1 class="h3 px-1">
              {{ posts.Board.Name }}
            </h1>
            <p class="text-base px-1">
              {{ posts.Board.Description }}
            </p>
            <div
              v-if="!isSingle"
              class="flex items-center justify-between mt-2 mb-3"
            >
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
                  v-if="0"
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
                class="btn primary small !text-base whitespace-nowrap"
                :to="`/forums/${posts.Board.UUID}/new`"
              >
                {{ $t("bb_new_post_cta") }}
              </router-link>
              <DefaultPaging
                v-if="paging"
                id="bbposts"
                :items="paging"
                :show-legend="false"
              />
            </div>
            <BBPost
              v-for="post in posts.Posts"
              :key="post.ID"
              :post="post"
              :posts="posts"
              :avatar-component="avatarComponent"
              :img-domain="imgDomain"
            />
          </div>
          <div class="flex items-center justify-end mt-2">
            <DefaultPaging v-if="paging" id="bbposts" :items="paging" />
          </div>
        </div>
      </template>
    </template>
    <notFoundPage v-else-if="is404" />
    <BBFooter />
  </div>
</template>
