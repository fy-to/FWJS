<script setup lang="ts">
import type { Component } from 'vue'

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/vue/24/solid'
import { onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import ScaleTransition from './transitions/ScaleTransition.vue'

interface NotifProps {
  imgSrc?: string
  imgIcon?: Component
  title: string
  content?: string
  ctaText?: string
  ctaLink?: string
  ctaAction?: () => void
  type?: 'info' | 'warning' | 'success'
  time?: number
}
const eventBus = useEventBus()
const currentNotif = ref<NotifProps | null>(null)
let currentTimeout: any | null = null
function onCall(data: NotifProps) {
  if (currentNotif.value !== null) {
    hideNotif()
  }
  const actualIcon = ref(data.imgIcon)
  if (data.imgIcon === undefined) {
    if (data.type === 'info') {
      actualIcon.value = LightBulbIcon
    }
    else if (data.type === 'warning') {
      actualIcon.value = ExclamationTriangleIcon
    }
    else if (data.type === 'success') {
      actualIcon.value = CheckCircleIcon
    }
  }
  if (!data.time || data.time < 1000) {
    data.time = 5000
  }

  currentNotif.value = {
    imgSrc: data.imgSrc,
    imgIcon: actualIcon.value,
    title: data.title,
    content: data.content,
    ctaText: data.ctaText,
    ctaLink: data.ctaLink,
    time: data.time,
    type: data.type,
    ctaAction: data.ctaAction,
  }

  currentTimeout = setTimeout(hideNotif, currentNotif.value.time)
}

function hideNotif() {
  currentNotif.value = null
  if (currentTimeout !== null) {
    clearTimeout(currentTimeout)
  }
}
onMounted(() => {
  eventBus.on('SendNotif', onCall)
})
onUnmounted(() => {
  eventBus.off('SendNotif', onCall)
})
</script>

<template>
  <ScaleTransition>
    <div
      v-if="currentNotif !== null"
      id="base-notif"
      class="p-2 mb-4 fixed bottom-4 right-8 !z-[2000] bg-fv-neutral-50/[.6] dark:bg-neutral-800/[.6]"
      role="alert"
      :class="{
        'text-fv-neutral-800 border border-fv-neutral-300 rounded-lg  dark:text-fv-neutral-400 dark:border-fv-neutral-600':
          currentNotif.type === 'info',
        'text-red-800 border border-red-300 rounded-lg  dark:text-red-300 dark:border-red-800':
          currentNotif.type === 'warning',
        'text-green-800 border border-green-300 rounded-lg  dark:text-green-300 dark:border-green-800':
          currentNotif.type === 'success',
      }"
    >
      <div class="flex items-center gap-2">
        <img
          v-if="currentNotif.imgSrc"
          class="flex-shrink-0 w-6 h-6"
          :src="currentNotif.imgSrc"
          :alt="currentNotif.title"
        >
        <component
          :is="currentNotif.imgIcon"
          v-else
          class="flex-shrink-0 w-6 h-6"
        />
        <h3 class="text-lg font-medium" v-text="currentNotif.title" />
      </div>
      <div
        v-if="currentNotif.content"
        class="mt-2text-sm"
        v-text="currentNotif.content"
      />
      <div class="flex justify-end gap-2 pt-3">
        <button
          type="button"
          class="btn neutral small"
          aria-label="Close"
          @click="hideNotif"
        >
          {{ $t("dismiss_cta") }}
        </button>
      </div>
    </div>
  </ScaleTransition>
</template>
