<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionRoot,
} from '@headlessui/vue'
import { XCircleIcon } from '@heroicons/vue/24/solid'
import { h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEventBus } from '../../composables/event-bus'

const props = withDefaults(
  defineProps<{
    id: string
    title?: string
    onOpen?: Function
    onClose?: Function
    closeIcon?: object
    mSize?: string
    ofy?: string
  }>(),
  {
    closeIcon: () => h(XCircleIcon),
    mSize: 'w-full',
    ofy: 'overflow-y-auto',
  },
)

const eventBus = useEventBus()

const isOpen = ref<boolean>(false)
const modalRef = ref<HTMLElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

function setModal(value: boolean) {
  if (value === true) {
    if (props.onOpen) props.onOpen()
    previouslyFocusedElement = document.activeElement as HTMLElement
  }
  if (value === false) {
    if (props.onClose) props.onClose()
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
    }
  }
  isOpen.value = value
}

onMounted(() => {
  eventBus.on(`${props.id}Modal`, setModal)
})

onUnmounted(() => {
  eventBus.off(`${props.id}Modal`, setModal)
})

watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick()
    modalRef.value?.focus()
  }
})
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
      class="fixed inset-0 overflow-y-auto"
      style="z-index: 40"
      aria-modal="true"
      role="dialog"
      :aria-labelledby="title ? `${props.id}-title` : undefined"
      @close="setModal"
    >
      <DialogPanel
        ref="modalRef"
        tabindex="-1"
        class="flex absolute backdrop-blur-[8px] inset-0 flex-col items-center justify-center min-h-screen text-fv-neutral-800 dark:text-fv-neutral-300 bg-fv-neutral-900/[.20] dark:bg-fv-neutral-50/[.20]"
        style="z-index: 41"
      >
        <div
          :class="`relative ${mSize} max-w-6xl max-h-full ${ofy} bg-white rounded-lg shadow dark:bg-fv-neutral-900`"
          style="z-index: 42"
        >
          <div
            v-if="title"
            class="flex items-center justify-between p-2 w-full border-b rounded-t dark:border-fv-neutral-700"
          >
            <slot name="before" />
            <h2
              v-if="title"
              :id="`${props.id}-title`"
              class="text-xl font-semibold text-fv-neutral-900 dark:text-white"
              v-html="title"
            />
            <button
              class="text-fv-neutral-400 bg-transparent hover:bg-fv-neutral-200 hover:text-fv-neutral-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-fv-neutral-600 dark:hover:text-white"
              aria-label="Close modal"
              @click="setModal(false)"
            >
              <component :is="closeIcon" class="w-7 h-7" />
            </button>
          </div>
          <div class="p-3 space-y-3">
            <slot />
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </TransitionRoot>
</template>
