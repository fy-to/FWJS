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
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <section class="pb-16 pt-4 px-3">
      <h1
        class="text-center text-3xl lg:text-4xl mb-3"
        v-html="$t('main_err_404_desc')"
      ></h1>

      <div class="flex flex-col items-center justify-center">
        <p class="body-p mb-3">
          {{ $t("404_description") }}
        </p>

        <div class="mt-2 flex justify-end w-full">
          <RouterLink to="/" class="btn primary defaults">{{
            $t("go_back_home")
          }}</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
