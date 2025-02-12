<script lang="ts" setup>
import { HomeIcon, ChevronRightIcon } from "@heroicons/vue/24/solid";
import type { BreadcrumbLink } from "../../types/types";

withDefaults(
  defineProps<{
    nav: BreadcrumbLink[];
    showHome?: boolean;
  }>(),
  {
    nav: () => [],
    showHome: () => false,
  },
);
</script>

<template>
  <ol
    class="inline-flex items-center flex-wrap"
    itemscope
    itemtype="https://schema.org/BreadcrumbList"
  >
    <li
      v-for="(item, index) in nav"
      :key="`bc_${index}`"
      class="inline-flex items-center"
      itemprop="itemListElement"
      itemscope
      itemtype="https://schema.org/ListItem"
    >
      <!-- Separator Icon: Display for all items except the first -->
      <ChevronRightIcon
        v-if="index !== 0"
        :class="
          index === 0
            ? 'w-4 h-4 mr-2 inline-block'
            : 'w-5 h-5 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
        "
      />

      <!-- If the breadcrumb has a link -->
      <template v-if="item.to">
        <router-link
          :to="item.to"
          itemprop="item"
          :class="
            index === 0
              ? 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white'
              : 'text-xs font-medium text-fv-neutral-700 hover:text-fv-neutral-900 dark:text-fv-neutral-200 dark:hover:text-white'
          "
        >
          <!-- Optionally display a home icon if showHome is true for the first item -->
          <template v-if="showHome && index === 0">
            <HomeIcon
              :class="
                index === 0
                  ? 'w-4 h-4 mr-2 inline-block'
                  : 'w-4 h-4 text-fv-neutral-400 inline-block mx-0.5 md:mx-1.5'
              "
            />
          </template>
          <span itemprop="name">{{ item.name }}</span>
        </router-link>
      </template>

      <!-- If there is no link for this breadcrumb -->
      <template v-else>
        <span itemprop="item" itemscope itemtype="https://schema.org/WebPage">
          <span itemprop="name">{{ item.name }}</span>
        </span>
      </template>

      <!-- Set the position of this breadcrumb in the list -->
      <meta itemprop="position" :content="(index + 1).toString()" />
    </li>
  </ol>
</template>
