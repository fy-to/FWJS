<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { Component } from "vue";
import { useRest } from "../../composables/rest";
import { LazyHead, useSeo } from "../../composables/seo";
import { useEventBus } from "../../composables/event-bus";

import type { BreadcrumbLink } from "../../types/types";
import DefaultBreadcrumb from "../ui/DefaultBreadcrumb.vue";
import { KlbContentCms, KlbAPIContentCmsSingle } from "../../types/klb";
const is404 = ref<boolean>(false);
const post = ref<KlbContentCms>();
const rest = useRest();
const seo = ref<LazyHead>({});
const route = useRoute();
const props = withDefaults(
  defineProps<{
    baseUrl: string;
    cmsAlias: string;
    notFound: Component;
    baseBreadcrumb?: BreadcrumbLink[];
    showImage?: boolean;
    showPreview?: boolean;
  }>(),
  {
    baseBreadcrumb: () => [],
    showImage: true,
    showPreview: true,
  },
);
const eventBus = useEventBus();
const getPage = async () => {
  eventBus.emit("main-loading", true);
  const result = await rest<KlbAPIContentCmsSingle>(
    `Content/Cms/${props.cmsAlias}:loadSlug`,
    "GET",
    {
      slug: route.params.slug,
      image_variation: [
        "strip&format=png&scale_crop=1200x630&alias=banner",
        "strip&format=png&scale_crop=500x500&alias=square",
      ],
    },
  ).catch((e) => {
    if (e.code == 404) {
      is404.value = true;
    }
    eventBus.emit("main-loading", false);
    return;
  });
  if (result && result.result == "success") {
    post.value = result.data.content_cms_entry_data;
    seo.value.title = post.value.Title;
    if (post.value.Short_Contents) {
      seo.value.description = post.value.Short_Contents;
    }
    seo.value.published = new Date(
      parseInt(post.value.Published.unixms),
    ).toISOString();
    seo.value.modified = new Date(
      parseInt(post.value.Last_Modified.unixms),
    ).toISOString();

    if (
      post.value.Top_Drive_Item &&
      post.value.Top_Drive_Item.Media_Image &&
      post.value.Top_Drive_Item.Media_Image.Variation
    ) {
      seo.value.image =
        post.value.Top_Drive_Item.Media_Image.Variation["square"];
    }
  } else {
    is404.value = true;
  }
  eventBus.emit("main-loading", false);
};
await getPage();
useSeo(seo);
watch(
  () => route.params.slug,
  (ov, nv) => {
    if (ov != nv) {
      is404.value = false;
      post.value = undefined;
      getPage();
    }
  },
);
</script>

<template>
  <div>
    <div v-if="!is404 && post">
      <div class="items-center flex justify-center mt-3">
        <DefaultBreadcrumb
          v-if="baseBreadcrumb.length > 0"
          :show-home="false"
          :nav="[...baseBreadcrumb, { name: post.Title }]"
          class="!hidden md:!flex"
        />
      </div>
      <article itemscope itemtype="https://schema.org/Article">
        <meta itemprop="datePublished" :content="post.Published.iso" />
        <meta itemprop="dateModified" :content="post.Last_Modified.iso" />
        <meta itemprop="inLanguage" :content="post.Language__" />
        <meta itemprop="headline" :content="post.Title" />
        <meta
          itemprop="thumbnailUrl"
          v-if="
            post.Top_Drive_Item &&
            post.Top_Drive_Item.Media_Image &&
            post.Top_Drive_Item.Media_Image.Variation
          "
          :content="post.Top_Drive_Item.Media_Image.Variation['square']"
        />
        <div class="py-4 px-4 max-w-6xl mx-auto">
          <h1
            class="mb-4 text-4xl tracking-tight font-extrabold text-center text-fv-neutral-900 dark:text-white"
          >
            {{ post.Title }}
          </h1>
          <p
            class="font-light text-center text-fv-neutral-500 dark:text-fv-neutral-400 sm:text-xl"
            v-if="post.Short_Contents && showPreview"
          >
            {{ post.Short_Contents }}
          </p>
        </div>
        <img
          v-if="
            post.Top_Drive_Item &&
            post.Top_Drive_Item.Media_Image &&
            post.Top_Drive_Item.Media_Image.Variation &&
            showImage
          "
          :src="post.Top_Drive_Item.Media_Image.Variation['square']"
          :alt="post.Title"
          class="h-auto rounded-xl shadow max-w-[768px] max-h-[280px] mx-auto mb-6"
        />
        <section
          itemprop="articleBody"
          class="prose dark:prose-invert max-w-6xl mx-auto mb-6"
          v-html="post.Contents"
        ></section>
      </article>
    </div>
    <component :is="notFound" v-if="is404" />
  </div>
</template>
