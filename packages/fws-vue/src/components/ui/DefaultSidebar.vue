<script lang="ts" setup>
import type { NavLink } from '../../types'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/solid'
import { useDebounceFn, useStorage } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    links: NavLink[]
    id?: string
    baseUrl?: string
  }>(),
  {
    id: 'main',
    baseUrl: '/',
  },
)

const route = useRoute()

// Cache storage key to avoid string concatenation
const storageKey = computed(() => `isOpenSidebar-${props.id}`)

// Create a cache for active links to avoid recalculation
const activeLinkCache = shallowRef(new Map<string, string>())

// Optimized link active check with memoization
function isLinkActive(link: NavLink) {
  const linkTo = link.to

  // Return from cache if available
  if (activeLinkCache.value.has(linkTo)) {
    return activeLinkCache.value.get(linkTo)
  }

  let result = ''
  if (linkTo !== props.baseUrl) {
    if (route.path === linkTo || route.path.includes(linkTo)) {
      result = 'fvside-active'
    }
  }
  else {
    if (route.path === linkTo) {
      result = 'fvside-active'
    }
  }

  // Cache the result
  activeLinkCache.value.set(linkTo, result)
  return result
}

// Debounce storage updates to prevent rapid toggling
const isOpen = useStorage(storageKey.value, true)

// Debounced toggle function
const toggleSidebar = useDebounceFn(() => {
  isOpen.value = !isOpen.value
}, 150)
</script>

<template>
  <aside class="fui-sidebar" :class="isOpen ? '' : 'fui-sidebar__md'">
    <div class="fui-sidebar__controller">
      <button
        class="btn neutral defaults"
        aria-controls="side-nav"
        @click="toggleSidebar"
      >
        <ArrowLeftIcon v-if="isOpen" />
        <ArrowRightIcon v-else />
        <span class="sr-only">{{ $t("sidebar_size_control") }}</span>
      </button>
    </div>
    <slot name="before" />
    <ul id="side-nav" role="list">
      <li v-for="(link, index) of links" :key="`aside_link_${index}`">
        <RouterLink
          :to="link.to"
          class="fui-sidebar__link"
          :class="isLinkActive(link)"
        >
          <div role="tooltip" class="fui-tooltip">
            {{ link.name }}
          </div>
          <component :is="link.icon" v-if="link.icon" />
          <span>{{ link.name }}</span>
          <span class="sr-only">{{ link.name }}</span>
        </RouterLink>
      </li>
      <slot name="lis" />
    </ul>
    <slot name="after" />
  </aside>
</template>

<style lang="scss" scoped>
.fui-sidebar {
  @apply w-60 transition-all duration-300 ease-in-out;
  .fui-sidebar__controller {
    @apply py-3 flex items-center justify-end pr-3;
    svg {
      @apply w-4 h-4;
    }
  }
  .fui-sidebar__link {
    @apply relative flex w-full items-center py-3 px-3 font-semibold text-sm border-l-[.4rem] border-l-transparent;
    @apply text-fv-neutral-600 hover:bg-fv-neutral-200/[.3] focus:bg-fv-neutral-200/[.3] hover:text-fv-primary-600;
    @apply dark:text-fv-neutral-300 dark:hover:bg-fv-neutral-700/[.3] dark:focus:bg-fv-neutral-700/[.3] dark:hover:text-fv-primary-400;
    @apply transition-all duration-300 ease-in-out;
    &.fvside-active {
      @apply border-l-fv-primary-500 bg-fv-neutral-200  hover:text-fv-neutral-600 focus:text-fv-neutral-600;
      @apply dark:bg-fv-neutral-700 dark:hover:text-fv-neutral-300 dark:text-fv-neutral-300;
    }
    svg {
      @apply w-6 h-6 mr-2 -ml-1 text-fv-neutral-400 dark:text-fv-neutral-500;
    }
    span {
      @apply whitespace-nowrap;
    }
  }

  &.fui-sidebar__md {
    @apply w-12;
    &.fui-sidebar__md {
      @apply w-12;
    }
    .fui-sidebar__link {
      @apply flex flex-col text-xs;
      svg {
        @apply mr-0;
      }
      span {
        @apply hidden;
      }
    }
    .fui-sidebar__link:hover .fui-tooltip,
    .fui-sidebar__link:focus .fui-tooltip,
    .fui-sidebar__link:active .fui-tooltip {
      @apply visible opacity-100 left-11 top-0 bottom-0 flex items-center;
    }
  }
}
@media screen and (max-width: 640px) {
  .fui-sidebar {
    @apply w-12;
    &.fui-sidebar__md {
      @apply w-12;
    }
    .fui-sidebar__controller {
      @apply hidden;
    }
    .fui-sidebar__link {
      @apply flex flex-col text-xs;
      svg {
        @apply mr-0;
      }
      span {
        @apply hidden;
      }
    }
    .fui-sidebar__link:hover .fui-tooltip,
    .fui-sidebar__link:focus .fui-tooltip,
    .fui-sidebar__link:active .fui-tooltip {
      @apply visible opacity-100 left-11 top-0 bottom-0 flex items-center;
    }
  }
}
</style>
