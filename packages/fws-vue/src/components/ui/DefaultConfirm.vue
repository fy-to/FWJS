<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useEventBus } from "../../composables/event-bus";
import DefaultModal from "./DefaultModal.vue";

const eventBus = useEventBus();
const title = ref<string | null>(null);
const desc = ref<string | null>(null);
const onConfirm = ref<Function | null>(null);
interface ConfirmModalData {
  title: string;
  desc: string;
  onConfirm: Function;
}
const _onConfirm = async () => {
  if (onConfirm.value) {
    await onConfirm.value();
  }
  resetConfirm();
};
const resetConfirm = () => {
  title.value = null;
  desc.value = null;
  onConfirm.value = null;
  eventBus.emit("confirmModal", false);
};
const showConfirm = (data: ConfirmModalData) => {
  title.value = data.title;
  desc.value = data.desc;
  onConfirm.value = data.onConfirm;
  eventBus.emit("confirmModal", true);
};

onMounted(() => {
  eventBus.on("resetConfirm", resetConfirm);
  eventBus.on("showConfirm", showConfirm);
});
onUnmounted(() => {
  eventBus.off("resetConfirm", resetConfirm);
  eventBus.off("showConfirm", showConfirm);
});
</script>
<template>
  <DefaultModal id="confirm">
    <div
      class="relative bg-fv-neutral-200 rounded-lg shadow dark:bg-fv-neutral-900"
    >
      <div class="p-1.5 lg:p-5 text-center">
        <p
          class="mb-3 !text-left prose prose-invert prose-sm !min-w-full"
          v-html="
            desc ? '<h2>' + title + '</h2>' + desc : '<h2>' + title + '</h2>'
          "
        ></p>
        <div class="flex justify-between gap-3 mt-4">
          <button class="btn danger defaults" @click="_onConfirm()">
            {{ $t("confirm_modal_cta_confirm") }}
          </button>
          <button
            class="btn neutral defaults"
            @click="$eventBus.emit('confirmModal', false)"
          >
            {{ $t("confirm_modal_cta_cancel") }}
          </button>
        </div>
      </div>
    </div>
  </DefaultModal>
</template>
