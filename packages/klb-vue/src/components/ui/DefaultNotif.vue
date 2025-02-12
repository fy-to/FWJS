<script setup lang="ts">
import type { Component } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/vue/24/solid'
import { onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import ScaleTransition from './transitions/ScaleTransition.vue'

/** Notification interface */
interface NotifProps {
  imgSrc?: string
  imgIcon?: Component
  title: string
  content?: string
  ctaText?: string
  ctaLink?: string
  ctaAction?: () => void
  /** Add your new 'secret' type */
  type?: 'info' | 'warning' | 'success' | 'secret'
  /** Notification timeout in milliseconds */
  time?: number
}

/** Our global event bus (replace with your own logic if needed) */
const eventBus = useEventBus()

/** Current displayed notification */
const currentNotif = ref<NotifProps | null>(null)

/** Progress percentage (0 to 100) for the notification’s life */
const progress = ref(0)

/** References to setTimeout / setInterval so we can clear them properly */
let hideTimeout: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

/**
 * Primary logic when a 'SendNotif' event is called.
 * - Clears any existing notification first
 * - Sets up the new notification
 * - Starts a progress bar
 */
function onCall(data: NotifProps) {
  // If there's an existing notification, remove it first
  hideNotif()

  // Ensure a minimum of 1s if time is too short or undefined
  if (!data.time || data.time < 1000) {
    data.time = 5000
  }

  // Automatically compute an icon if none is provided
  if (!data.imgIcon) {
    if (data.type === 'info') data.imgIcon = LightBulbIcon
    else if (data.type === 'warning') data.imgIcon = ExclamationTriangleIcon
    else if (data.type === 'success') data.imgIcon = CheckCircleIcon
    else if (data.type === 'secret') data.imgIcon = SparklesIcon
  }

  // Set the new notification
  currentNotif.value = {
    ...data,
  }

  // (A) Hide the notification after the specified time
  hideTimeout = setTimeout(() => hideNotif(), data.time)

  // (B) Animate the progress bar from 0 to 100% within that time
  progress.value = 0
  progressInterval = setInterval(() => {
    if (currentNotif.value && data.time) {
      // update progress based on a 100ms tick
      progress.value += (100 / (data.time / 100))
      // if progress hits or exceeds 100, hide
      if (progress.value >= 100) {
        hideNotif()
      }
    }
  }, 100)
}

/**
 * Clears everything related to the current notification
 */
function hideNotif() {
  currentNotif.value = null
  progress.value = 0

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

/**
 * Setup: Listen to the global event bus
 */
onMounted(() => {
  eventBus.on('SendNotif', onCall)
})

/**
 * Cleanup: remove event listeners
 */
onUnmounted(() => {
  eventBus.off('SendNotif', onCall)
})
</script>

<template>
  <ScaleTransition>
    <div
      v-if="currentNotif !== null"
      id="base-notif"
      class=" mb-4 fixed bottom-4 right-8 !z-[2000] bg-fv-neutral-50/[.6] dark:bg-neutral-800/[.85] rounded-lg border overflow-hidden shadow-lg"
      role="alert"
      :class="{
        'text-fv-neutral-800 border-fv-neutral-300 dark:text-fv-neutral-400 dark:border-fv-neutral-600':
          currentNotif.type === 'info',
        'text-red-800 border-red-300 dark:text-red-300 dark:border-red-800':
          currentNotif.type === 'warning',
        'text-green-800 border-green-300 dark:text-green-300 dark:border-green-800':
          currentNotif.type === 'success',
        'text-fuchsia-800 border-fuchsia-300 dark:text-fuchsia-300 dark:border-fuchsia-800':
          currentNotif.type === 'secret',
      }"
    >
      <div class="relative  h-[4px] bg-fv-neutral-900/[.2] rounded-full overflow-hidden ">
        <!-- We re-use text color (text-*) as background or define a custom color -->
        <div
          class="absolute left-0 top-0 h-full bg-current transition-[width]"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <div class="p-2">
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

        <!-- Optional content -->
        <div
          v-if="currentNotif.content"
          class="mt-2 text-sm prose-sm prose-invert"
          v-html="currentNotif.content"
        />

        <!-- CTA row (if you need more buttons, just extend it) -->
        <div class="flex justify-end gap-2 pt-3">
          <button
            type="button"
            class="btn neutral small"
            aria-label="Close"
            @click="hideNotif"
          >
            <!-- i18n example, or plain text like "Dismiss" -->
            {{ $t("dismiss_cta") }}
          </button>
        </div>
      </div>
    </div>
  </ScaleTransition>
</template>
