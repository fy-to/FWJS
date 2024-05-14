<script setup lang="ts">
import { ref } from "vue";
import { UserData, UserProfile } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <section class="bg-neutral-100 shadow rounded p-4 m-4">
      <UserData />
    </section>
    <section class="bg-neutral-100 shadow rounded p-4 m-4">
      <UserProfile />
    </section>
  </div>
</template>
