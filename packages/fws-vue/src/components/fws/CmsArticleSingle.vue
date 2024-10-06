<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import type { Component } from "vue";
import { useRest } from "../../composables/rest";
import { LazyHead, useSeo } from "../../composables/seo";
import type { BreadcrumbLink } from "../../types";
import DefaultBreadcrumb from "../ui/DefaultBreadcrumb.vue";
import { defineWebPage, useSchemaOrg } from "@unhead/schema-org";

const props = withDefaults(
  defineProps<{
    baseUrl: string;
    cmsAlias: string;
    notFound: Component;
    baseBreadcrumb?: BreadcrumbLink[];
    showImage?: boolean;
    showPreview?: boolean;
    showTitle?: boolean;
    postValue?: any;
    passData?: boolean;
    imageDomain?: string;
    multLanguage?: boolean;
    urlSlug?: string;
  }>(),
  {
    baseBreadcrumb: () => [],
    showImage: true,
    showPreview: true,
    showTitle: true,
    postValue: () => undefined,
    passData: false,
    imageDomain: "https://s.nocachenocry.com",
    multLanguage: true,
    urlSlug: "blog",
  },
);

const rest = useRest();
const post = ref<any>([]);
const route = useRoute();
const seo = ref<LazyHead>({});
const is404 = ref(false);
const getBlogPost = async () => {
  let data: any = undefined;
  if (!props.passData) {
    data = await rest(`Cms/${props.cmsAlias}/Post/${route.params.slug}`, "GET");
  } else {
    data = props.postValue;
  }
  if (data && data.result == "success") {
    post.value = data.data;
    seo.value.title = post.value.Title;
    seo.value.description = post.value.Overview;

    if (post.value.CoverUUID) {
      seo.value.image = `${props.imageDomain}/${post.value.CoverUUID}?vars=format=png:resize=512x512`;
      seo.value.imageWidth = "512";
      seo.value.imageHeight = "512";
      seo.value.imageType = "image/png";
    }
    if (post.value.Locale != "") {
      seo.value.locale = post.value.Locale;
    } else {
      seo.value.locale = "en-US";
    }
    if (props.multLanguage) {
      seo.value.url = `https://${props.baseUrl}/l/${seo.value.locale}/${props.urlSlug}/${post.value.Slug}`;
    } else {
      seo.value.url = `https://${props.baseUrl}/${props.urlSlug}/${post.value.Slug}`;
    }
    if (post.value.Locales && post.value.Locales.length > 1) {
      seo.value.alternateLocales = post.value.Locales;
    }
  } else {
    if (!props.passData) {
      is404.value = true;
    }
  }
};
await getBlogPost();
watchEffect(() => {
  getBlogPost();
});
useSeo(seo);
useSchemaOrg([
  defineWebPage({
    datePublished: post.value.CreatedAt.iso,
    dateModified: post.value.UpdatedAt.iso,
  }),
]);
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
        <meta itemprop="wordCount" :content="post.WordCount" />
        <meta itemprop="datePublished" :content="post.CreatedAt.iso" />
        <meta itemprop="dateModified" :content="post.UpdatedAt.iso" />
        <meta itemprop="inLanguage" :content="post.Locale" />
        <meta itemprop="headline" :content="post.Title" />
        <meta
          itemprop="thumbnailUrl"
          v-if="post.CoverUUID"
          :content="`${props.imageDomain}/${post.CoverUUID}?vars=format=webp:resize=512x512`"
        />
        <div class="py-4 px-4 !max-w-full mx-auto w-full" v-if="showTitle">
          <h1
            class="mb-4 text-4xl tracking-tight font-extrabold text-center text-fv-neutral-900 dark:text-white"
          >
            {{ post.Title }}
          </h1>
          <p
            class="font-light text-center text-fv-neutral-500 dark:text-fv-neutral-400 sm:text-xl"
            v-if="showPreview"
          >
            {{ post.Overview }}
          </p>
        </div>
        <img
          v-if="post.CoverUUID && showImage"
          :src="`${props.imageDomain}/${post.CoverUUID}?vars=format=webp:resize=768x768`"
          :alt="post.Title"
          class="h-auto rounded-xl shadow max-w-[768px] max-h-[280px] mx-auto mb-6"
        />
        <section
          itemprop="articleBody"
          class="prose dark:prose-invert !max-w-full mx-auto w-full mb-6"
          v-html="post.Body"
        ></section>
      </article>
    </div>
    <component :is="notFound" v-if="is404" />
  </div>
</template>
