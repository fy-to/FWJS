<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import DefaultInput from './DefaultInput.vue'
import DefaultModal from './DefaultModal.vue'

const eventBus = useEventBus()
const title = ref<string | null>(null)
const desc = ref<string | null>(null)
const inputLabel = ref<string | undefined>(undefined)
const inputPlaceholder = ref<string | undefined>(undefined)
const expectedValue = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const onConfirm = ref<Function | null>(null)
const isOpen = ref<boolean>(false)
const modalRef = ref<HTMLElement | null>(null)
const inputValue = ref<string>('')
const inputError = ref<string>('')
let previouslyFocusedElement: HTMLElement | null = null

interface ConfirmWithInputModalData {
  title: string
  desc: string
  inputLabel?: string
  inputPlaceholder?: string
  expectedValue?: string
  errorMessage?: string
  onConfirm: (inputValue: string) => void | Promise<void>
}

const _onConfirm = useDebounceFn(async () => {
  // If expectedValue is set, validate the input
  if (expectedValue.value && inputValue.value.toLocaleLowerCase() !== expectedValue.value.toLocaleLowerCase()) {
    inputError.value = errorMessage.value || 'Incorrect value entered'
    return
  }

  if (onConfirm.value) {
    await onConfirm.value(inputValue.value)
  }
  resetConfirm()
}, 300)

function resetConfirm() {
  title.value = null
  desc.value = null
  inputLabel.value = undefined
  inputPlaceholder.value = undefined
  expectedValue.value = null
  errorMessage.value = null
  onConfirm.value = null
  isOpen.value = false
  inputValue.value = ''
  inputError.value = ''
  eventBus.emit('confirmWithInputModal', false)
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus()
  }
}

function showConfirmWithInput(data: ConfirmWithInputModalData) {
  title.value = data.title
  desc.value = data.desc
  inputLabel.value = data.inputLabel || undefined
  inputPlaceholder.value = data.inputPlaceholder || undefined
  expectedValue.value = data.expectedValue || null
  errorMessage.value = data.errorMessage || null
  onConfirm.value = data.onConfirm
  inputValue.value = ''
  inputError.value = ''

  // Emit event first to ensure it's registered before opening the modal
  eventBus.emit('confirmWithInputModal', true)

  // Use requestAnimationFrame instead of setTimeout for better performance
  requestAnimationFrame(() => {
    isOpen.value = true
    eventBus.emit('confirmWithInputModal', true)

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
  eventBus.on('resetConfirmWithInput', resetConfirm)
  eventBus.on('showConfirmWithInput', showConfirmWithInput)
})

onUnmounted(() => {
  eventBus.off('resetConfirmWithInput', resetConfirm)
  eventBus.off('showConfirmWithInput', showConfirmWithInput)
})
</script>

<template>
  <DefaultModal
    id="confirmWithInput"
    ref="modalRef"
    m-size="!max-w-3xl w-full"
  >
    <div
      class="bg-gradient-to-br from-gray-900/70 to-gray-800/50 rounded-lg border border-gray-700/30 overflow-hidden"
      :aria-labelledby="title ? 'confirm-input-modal-title' : undefined"
      :aria-describedby="desc ? 'confirm-input-modal-desc' : undefined"
      aria-modal="true"
      role="dialog"
      tabindex="-1"
    >
      <!-- Header with gradient background -->
      <div
        v-if="title"
        class="bg-gradient-to-r from-indigo-900/30 to-indigo-800/20 p-4 border-b border-indigo-700/30"
      >
        <h3
          id="confirm-input-modal-title"
          class="text-xl font-semibold text-white"
        >
          {{ title }}
        </h3>
      </div>

      <!-- Content area with styled box -->
      <div class="p-5 text-fv-neutral-100">
        <div v-if="desc" class="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 p-4 rounded-lg border border-blue-700/30 mb-6 shadow-md">
          <p
            id="confirm-input-modal-desc"
            class="text-sm sm:text-base text-gray-200 prose prose-invert prose-sm min-w-full"
            v-html="desc"
          />
        </div>

        <!-- Input field -->
        <div class="mb-6">
          <DefaultInput
            id="confirmInput"
            v-model="inputValue"
            type="text"
            :label="inputLabel"
            :placeholder="inputPlaceholder"
            :error="inputError"
            autocomplete="off"
            class="w-full"
            @keyup.enter="_onConfirm()"
          />
        </div>

        <!-- Action buttons with modern styling -->
        <div class="flex justify-center gap-4 mt-6">
          <button
            class="btn accent large shadow-lg hover:shadow-fuchsia-500/30 transition-all duration-300 hover:scale-105 active:scale-95 px-8 rounded-lg"
            :disabled="!inputValue.trim()"
            @click="_onConfirm()"
          >
            {{ $t("confirm_modal_cta_confirm") }}
          </button>
          <button
            class="btn neutral large shadow-md transform transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 px-8 rounded-lg"
            @click="resetConfirm()"
          >
            {{ $t("confirm_modal_cta_cancel") }}
          </button>
        </div>
      </div>
    </div>
  </DefaultModal>
</template>
