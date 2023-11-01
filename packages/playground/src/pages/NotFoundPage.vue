<script setup lang="ts">
import { ref } from "vue";
import { useSeo, useTranslation, useServerRouter } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();
const router = useServerRouter();
router.status = 404;

useSeo(
  ref({
    title: translate("title_not_found_page"),
    description: translate("desc_not_found_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">Not found</div>
</template>
