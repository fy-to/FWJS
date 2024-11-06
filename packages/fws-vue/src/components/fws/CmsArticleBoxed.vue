<script setup lang="ts">
import { CalendarDaysIcon } from '@heroicons/vue/24/solid'

defineProps({
  article: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    default: 'blog',
  },
  imageDomain: {
    type: String,
    default: 'https://s.nocachenocry.com',
  },
})
</script>

<template>
  <article
    itemscope
    itemtype="https://schema.org/Article"
    class="p-3 flex flex-col justify-between bg-white noise rounded-lg border border-fv-neutral-200 shadow-md dark:bg-fv-neutral-800 dark:border-fv-neutral-700"
  >
    <meta itemprop="wordCount" :content="article.WordCount">
    <meta itemprop="datePublished" :content="article.CreatedAt.iso">
    <meta itemprop="dateModified" :content="article.UpdatedAt.iso">
    <meta itemprop="inLanguage" :content="article.Locale">
    <meta itemprop="headline" :content="article.Title">
    <meta
      v-if="article.CoverUUID"
      itemprop="thumbnailUrl"
      :content="`${imageDomain}/${article.CoverUUID}?vars=format=webp:resize=512x512`"
    >
    <RouterLink
      :to="`/${type}/${article.Slug}`"
      :title="article.Title"
      :alt="article.Title"
    >
      <img
        v-if="article.CoverUUID"
        :src="`${imageDomain}/${article.CoverUUID}?vars=format=webp:scale_crop_center=400x195`"
        loading="lazy"
        :title="article.Title"
        :alt="article.Title"
        class="w-full rounded-lg bg-fv-neutral-800 shadow mb-3 flex-grow-0 flex-shrink-0"
        width="400"
        height="250"
      >
    </RouterLink>
    <h2 class="title-1 font-semibold mb-2 flex-grow-0">
      <RouterLink
        :to="`/${type}/${article.Slug}`"
        :title="article.Title"
        :alt="article.Title"
        rel="bookmark"
      >
        {{ article.Title }}
      </RouterLink>
    </h2>
    <p
      class="mb-5 font-light text-fv-neutral-500 dark:text-fv-neutral-400 flex-grow"
      itemprop="description"
    >
      {{ article.Overview }}
    </p>
    <div class="flex justify-between items-center flex-grow-0">
      <div class="flex justify-end items-center text-fv-neutral-500">
        <time
          class="text-sm inline-flex items-center justify-center gap-x-1"
          itemprop="datePublished"
          :content="new Date(parseInt(article.CreatedAt.unixms)).toISOString()"
          :datetime="new Date(parseInt(article.CreatedAt.unixms)).toISOString()"
        >
          <CalendarDaysIcon class="w-4 h-4 -mt-0.5" />
          {{ $formatDate(article.CreatedAt.unixms) }}
        </time>
        <meta
          itemprop="dateModified"
          :content="new Date(parseInt(article.UpdatedAt.unixms)).toISOString()"
        >
        <meta itemprop="inLanguage" :content="article.Language__">
        <meta
          itemprop="dateModified"
          :content="new Date(parseInt(article.UpdatedAt.unixms)).toISOString()"
        >
      </div>
      <!-- <span
        ><img
          class="h-4 shadow"
          :src="langs[article.Locale]"
          width="24"
          height="16"
          loading="lazy"
        />
      </span> -->
      <RouterLink
        :to="`/${type}/${article.Slug}`"
        :title="article.Title"
        :alt="article.Title"
        class="inline-flex items-center font-medium text-primary-600 dark:text-primary-500 hover:underline"
      >
        {{ $t("read_more_cta") }}
        <svg
          class="ml-2 w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </RouterLink>
    </div>
  </article>
</template>
