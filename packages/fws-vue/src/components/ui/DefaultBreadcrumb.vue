<script lang="ts" setup>
import { HomeIcon, ChevronRightIcon } from "@heroicons/vue/24/solid";
import type { BreadcrumbLink } from "../../types";
withDefaults(
  defineProps<{
    nav: BreadcrumbLink[];
    showHome: Boolean;
  }>(),
  {
    nav: () => [],
    showHome: () => true,
  },
);
</script>
<template>
  <ol
    class="inline-flex items-center flex-wrap"
    itemscope
    itemtype="https://schema.org/BreadcrumbList"
  >
    <template v-for="(item, index) in nav" :key="`bc_${index.toString()}`">
      <li class="'inline-flex items-center'">
        <ChevronRightIcon
          v-if="index != 0"
          :class="
            item.to
              ? index == 0
                ? 'w-4 h-4 mr-2  inline-block'
                : 'w-5 h-5 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
              : 'w-5 h-5 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
          "
        />

        <router-link
          :to="item.to"
          v-if="item.to"
          itemprop="itemListElement"
          itemtype="https://schema.org/ListItem"
          itemscope
          :class="
            item.to
              ? index == 0
                ? 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white'
                : 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900  dark:text-fv-neutral-200 dark:hover:text-white'
              : ''
          "
        >
          <HomeIcon
            :class="
              item.to
                ? index == 0
                  ? 'w-4 h-4 mr-2  inline-block'
                  : 'w-4 h-4 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
                : 'w-4 h-4 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
            "
            v-if="showHome && index === 0"
          />
          <span itemprop="name">{{ item.name }}</span>
          <meta itemprop="position" :content="(index + 1).toString()" />
          <meta itemprop="url" :content="item.to" />
        </router-link>
        <span
          class="text-xs font-medium text-fv-neutral-500 dark:text-fv-neutral-200"
          v-else
          itemprop="itemListElement"
          itemtype="https://schema.org/ListItem"
          itemscope
        >
          <span itemprop="name">{{ item.name }}</span>
          <meta itemprop="position" :content="(index + 1).toString()" />
        </span>
      </li>
    </template>
  </ol>
</template>
