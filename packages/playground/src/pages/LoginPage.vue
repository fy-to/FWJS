<script setup lang="ts">
import { ref } from "vue";
import { useSeo, UserFlow, useTranslation } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();
useSeo(
  ref({
    title: translate("title_login_page"),
    description: translate("desc_login_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <UserFlow
      returnDefault="/"
      :forceAction="
        typeof $route.query.act == 'string' ? $route.query.act : undefined
      "
    />
  </div>
</template>
