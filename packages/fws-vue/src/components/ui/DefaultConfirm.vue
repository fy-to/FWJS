<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import DefaultModal from './DefaultModal.vue'

const eventBus = useEventBus()
const title = ref<string | null>(null)
const desc = ref<string | null>(null)
const onConfirm = ref<Function | null>(null)
const isOpen = ref<boolean>(false)
const modalRef = ref<HTMLElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

interface ConfirmModalData {
  title: string
  desc: string
  onConfirm: Function
}

const _onConfirm = useDebounceFn(async () => {
  if (onConfirm.value) {
    await onConfirm.value()
  }
  resetConfirm()
}, 300)

function resetConfirm() {
  title.value = null
  desc.value = null
  onConfirm.value = null
  isOpen.value = false
  eventBus.emit('confirmModal', false)
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus()
  }
}

function showConfirm(data: ConfirmModalData) {
  title.value = data.title
  desc.value = data.desc
  onConfirm.value = data.onConfirm

  // Emit event first to ensure it's registered before opening the modal
  eventBus.emit('confirmModal', true)

  // Use requestAnimationFrame instead of setTimeout for better performance
  requestAnimationFrame(() => {
    isOpen.value = true
    eventBus.emit('confirmModal', true)

    nextTick(() => {
      previouslyFocusedElement = document.activeElement as HTMLElement
      try {
        modalRef.value?.focus()
      }
      catch {
      }
    })
  })
}

onMounted(() => {
  eventBus.on('resetConfirm', resetConfirm)
  eventBus.on('showConfirm', showConfirm)
})

onUnmounted(() => {
  eventBus.off('resetConfirm', resetConfirm)
  eventBus.off('showConfirm', showConfirm)
})
</script>

<template>
  <DefaultModal
    id="confirm"

    ref="modalRef"
  >
    <div
      class="relative bg-fv-neutral-200 rounded-lg shadow dark:bg-fv-neutral-900"
      :aria-labelledby="title ? 'confirm-modal-title' : undefined"
      :aria-describedby="desc ? 'confirm-modal-desc' : undefined"
      aria-modal="true"
      role="dialog"
      tabindex="-1"
    >
      <div
        class="p-1.5 lg:p-5 text-center max-h-[80vh] overflow-y-auto cool-scroll"
      >
        <h2
          v-if="title"
          id="confirm-modal-title"
          class="text-xl font-semibold text-fv-neutral-900 dark:text-white"
        >
          {{ title }}
        </h2>
        <p
          v-if="desc"
          id="confirm-modal-desc"
          class="mb-3 text-left prose prose-invert prose-sm min-w-full"
          v-html="desc"
        />
        <div class="flex justify-between gap-3 mt-4">
          <button class="btn danger defaults" @click="_onConfirm()">
            {{ $t("confirm_modal_cta_confirm") }}
          </button>
          <button class="btn neutral defaults" @click="resetConfirm()">
            {{ $t("confirm_modal_cta_cancel") }}
          </button>
        </div>
      </div>
    </div>
  </DefaultModal>
</template>
