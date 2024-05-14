<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
} from "@headlessui/vue";
import { ref, onMounted, onUnmounted, h } from "vue";
import { XCircleIcon } from "@heroicons/vue/24/solid";
import { useEventBus } from "../../composables/event-bus";
const props = withDefaults(
  defineProps<{
    id: string;
    title?: string;
    onOpen?: Function;
    onClose?: Function;
    closeIcon?: Object;
    mSize?: string;
  }>(),
  {
    closeIcon: () => h(XCircleIcon),
    mSize: "w-full",
  },
);

const eventBus = useEventBus();

const isOpen = ref<boolean>(false);
const setModal = (value: boolean) => {
  if (value === true) {
    if (props.onOpen) props.onOpen();
  } else {
    if (props.onClose) props.onClose();
  }
  isOpen.value = value;
};
onMounted(() => {
  eventBus.on(`${props.id}Modal`, setModal);
});
onUnmounted(() => {
  eventBus.off(`${props.id}Modal`, setModal);
});
</script>
<template>
  <TransitionRoot
    :show="isOpen"
    as="template"
    enter="duration-300 ease-out"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="duration-200 ease-in"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <Dialog
      :open="isOpen"
      @close="setModal"
      class="fixed inset-0 overflow-y-auto"
      style="z-index: 40"
    >
      <DialogPanel
        class="flex absolute backdrop-blur-[8px] inset-0 flex-col items-center justify-center min-h-screen text-fv-neutral-800 dark:text-fv-neutral-300 bg-fv-neutral-900/[.20] dark:bg-fv-neutral-50/[.20]"
        style="z-index: 41"
      >
        <div
          :class="`relative ${mSize} max-w-6xl max-h-full overflow-y-auto bg-white rounded-lg shadow dark:bg-fv-neutral-800`"
          style="z-index: 42"
        >
          <div
            class="flex items-center justify-between p-2 w-full border-b rounded-t dark:border-fv-neutral-700"
            v-if="title"
          >
            <slot name="before"></slot>
            <h2
              class="text-xl font-semibold text-fv-neutral-900 dark:text-white"
              v-if="title"
              v-html="title"
            />
            <button
              @click="setModal(false)"
              class="text-fv-neutral-400 bg-transparent hover:bg-fv-neutral-200 hover:text-fv-neutral-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-fv-neutral-600 dark:hover:text-white"
            >
              <component :is="closeIcon" class="w-7 h-7" />
            </button>
          </div>
          <div class="p-3 space-y-3">
            <slot></slot>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </TransitionRoot>
</template>
