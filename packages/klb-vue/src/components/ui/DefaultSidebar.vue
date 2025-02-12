<script lang="ts" setup>
import { NavLink } from "../../types/types";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/vue/24/solid";
import { useStorage } from "@vueuse/core";
import { useRoute } from "vue-router";

const props = withDefaults(
  defineProps<{
    links: NavLink[];
    id?: string;
    baseUrl?: string;
  }>(),
  {
    id: "main",
    baseUrl: "/",
  },
);
const route = useRoute();
const isLinkActive = (link: NavLink) => {
  if (link.to != props.baseUrl) {
    if (route.path == link.to || route.path.includes(link.to))
      return "fvside-active";
  } else {
    if (route.path == link.to) {
      return "fvside-active";
    }
  }
  return "";
};
const isOpen = useStorage(`isOpenSidebar-${props.id}`, true);
</script>
<template>
  <aside class="fui-sidebar" :class="isOpen ? '' : 'fui-sidebar__md'">
    <div class="fui-sidebar__controller">
      <button
        class="btn neutral defaults"
        aria-controls="side-nav"
        @click="isOpen = !isOpen"
      >
        <ArrowLeftIcon v-if="isOpen" />
        <ArrowRightIcon v-else />
        <span class="sr-only">{{ $t("sidebar_size_control") }}</span>
      </button>
    </div>
    <slot name="before"></slot>
    <ul role="list" id="side-nav">
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
      <slot name="lis"></slot>
    </ul>
    <slot name="after"></slot>
  </aside>
</template>
<style lang="scss" scoped>
.fui-sidebar {
  @apply w-60;
  transition: width 600ms ease-in-out;
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

    transition: all 300ms ease-in-out;

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
