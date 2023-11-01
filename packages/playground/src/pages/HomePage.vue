<script setup lang="ts">
import { ref } from "vue";
import { useSeo, useTranslation } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();
useSeo(
  ref({
    title: translate("title_home_page"),
    description: translate("desc_home_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template><div>Home</div></template>
