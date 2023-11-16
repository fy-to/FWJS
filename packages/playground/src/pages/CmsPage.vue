<script setup lang="ts">
import { CmsArticleSingle } from "@fy-/fws-vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <CmsArticleSingle
      base-url="https://fws.fy.to/pages"
      cms-alias="pages"
      :not-found="NotFoundPage"
      :show-image="false"
      :show-preview="false"
      class="px-3"
    />
  </div>
</template>
