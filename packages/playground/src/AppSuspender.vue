<script setup lang="ts">
import App from "./App.vue";
import FWSLogo from "./assets/logo.svg";
import { DefaultLoader } from "@fy-/fws-vue";
</script>

<template>
  <Suspense>
    <template #default>
      <App />
    </template>
    <template #fallback>
      <DefaultLoader
        id="ts"
        :show-loading-text="false"
        :image="FWSLogo"
        :force="true"
      />
    </template>
  </Suspense>
</template>
