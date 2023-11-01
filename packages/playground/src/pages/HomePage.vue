<script setup lang="ts">
import { ref } from "vue";
import {
  useSeo,
  useTranslation,
  DefaultModal,
  useEventBus,
  DefaultConfirm,
} from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();
const eventBus = useEventBus();
const testConfirm = async () => {
  eventBus.emit("showConfirm", {
    title: translate("confirm_export_visible_title"),
    onConfirm: async () => {
      eventBus.emit("main-loading", true);
      console.log("testConfirm");
      eventBus.emit("main-loading", false);
    },
  });
};
useSeo(
  ref({
    title: translate("title_home_page"),
    description: translate("desc_home_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <DefaultModal id="test" title="Test Modal">
      <p>Test Modal</p>
    </DefaultModal>
    <button
      class="btn primary defaults"
      @click="$eventBus.emit('testModal', true)"
    >
      Open Modal
    </button>
    <button class="btn primary defaults" @click="testConfirm">
      Test confirm
    </button>
    Home
  </div>
  <DefaultConfirm />
</template>
