<script setup lang="ts">
import { BBHome } from "@fy-/fws-obelix";
import NotFoundPage from "@/pages/NotFoundPage.vue";
import AvatarTest from "@/pages/AvatarTest.vue";
import TestBite from "@/pages/TestBiet.vue";
</script>

<template>
  <div class="bb-base-container bb-base w-full">
    <BBHome
      :not-found-page="NotFoundPage"
      :is-single="true"
      :avatar-component="AvatarTest"
      :rank-component="TestBite"
    />
  </div>
</template>
