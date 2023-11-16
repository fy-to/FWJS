<script setup lang="ts">
import { useSeo, useTranslation } from "@fy-/fws-vue";
import { ref } from "vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();
useSeo(
  ref({
    title: translate("title_doc_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <h1 class="font-bold text-2xl mb-4">{{ $t("title_doc_page") }}</h1>
    <p>... 😳</p>
  </div>
</template>
