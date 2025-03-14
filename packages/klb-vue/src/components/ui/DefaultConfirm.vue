<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import DefaultModal from './DefaultModal.vue'

const eventBus = useEventBus()
const title = ref<string | null>(null)
const desc = ref<string | null>(null)
const onConfirm = ref<Function | null>(null)
interface ConfirmModalData {
  title: string
  desc: string
  onConfirm: Function
}
async function _onConfirm() {
  if (onConfirm.value) {
    await onConfirm.value()
  }
  resetConfirm()
}
function resetConfirm() {
  title.value = null
  desc.value = null
  onConfirm.value = null
  eventBus.emit('confirmModal', false)
}
function showConfirm(data: ConfirmModalData) {
  title.value = data.title
  desc.value = data.desc
  onConfirm.value = data.onConfirm
  eventBus.emit('confirmModal', true)
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
  <DefaultModal id="confirm" :title="title ? title : ''">
    <div
      class="relative bg-fv-neutral-200 rounded-lg shadow dark:bg-fv-neutral-800"
    >
      <div class="p-6 text-center">
        <ExclamationCircleIcon
          class="mx-auto mb-4 text-fv-neutral-400 w-12 h-12 dark:text-fv-neutral-200"
        />

        <h3
          class="mb-5 text-lg font-normal text-fv-neutral-500 dark:text-fv-neutral-400"
        >
          {{ desc ? desc : title }}
        </h3>
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
