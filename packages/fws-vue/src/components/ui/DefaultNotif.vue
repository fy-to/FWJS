<script setup lang="ts">
import type { Component } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref } from 'vue'
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

/** Progress percentage (0 to 100) for the notification's life */
const progress = ref(0)

/** Is the notification paused (e.g., when hovering) */
const isPaused = ref(false)

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
    if (data.type === 'info') data.imgIcon = InformationCircleIcon
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
    if (currentNotif.value && data.time && !isPaused.value) {
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
  isPaused.value = false

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

/** Pause the notification timer on hover */
function pauseTimer() {
  isPaused.value = true

  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

/** Resume the notification timer after hover */
function resumeTimer() {
  if (!currentNotif.value) return

  isPaused.value = false

  // Calculate remaining time based on progress
  const remainingTime = currentNotif.value.time
    ? Math.max(currentNotif.value.time * (1 - progress.value / 100), 1000)
    : 5000

  // Reset the timeout with the remaining time
  hideTimeout = setTimeout(() => hideNotif(), remainingTime)
}

/** Execute CTA action if provided */
function handleCtaClick() {
  if (currentNotif.value?.ctaAction) {
    currentNotif.value.ctaAction()
  }
}

/** Get ARIA label based on notification type */
const ariaDescribedBy = computed(() => {
  if (!currentNotif.value) return ''
  return `notif-${currentNotif.value.type || 'info'}`
})

/** Get background color based on notification type */
const bgColor = computed(() => {
  if (!currentNotif.value) return ''

  switch (currentNotif.value.type) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20'
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20'
    case 'secret':
      return 'bg-fuchsia-50 dark:bg-fuchsia-900/20'
    default: // info
      return 'bg-blue-50 dark:bg-blue-900/20'
  }
})

/** Get border color based on notification type */
const borderColor = computed(() => {
  if (!currentNotif.value) return ''

  switch (currentNotif.value.type) {
    case 'success':
      return 'border-green-300 dark:border-green-700'
    case 'warning':
      return 'border-amber-300 dark:border-amber-700'
    case 'secret':
      return 'border-fuchsia-300 dark:border-fuchsia-700'
    default: // info
      return 'border-blue-300 dark:border-blue-700'
  }
})

/** Get text color based on notification type */
const textColor = computed(() => {
  if (!currentNotif.value) return ''

  switch (currentNotif.value.type) {
    case 'success':
      return 'text-green-800 dark:text-green-200'
    case 'warning':
      return 'text-amber-800 dark:text-amber-200'
    case 'secret':
      return 'text-fuchsia-800 dark:text-fuchsia-200'
    default: // info
      return 'text-blue-800 dark:text-blue-200'
  }
})

/** Get icon color based on notification type */
const iconColor = computed(() => {
  if (!currentNotif.value) return ''

  switch (currentNotif.value.type) {
    case 'success':
      return 'text-green-500 dark:text-green-400'
    case 'warning':
      return 'text-amber-500 dark:text-amber-400'
    case 'secret':
      return 'text-fuchsia-500 dark:text-fuchsia-400'
    default: // info
      return 'text-blue-500 dark:text-blue-400'
  }
})

/** Get progress bar color based on notification type */
const progressColor = computed(() => {
  if (!currentNotif.value) return ''

  switch (currentNotif.value.type) {
    case 'success':
      return 'bg-green-500 dark:bg-green-400'
    case 'warning':
      return 'bg-amber-500 dark:bg-amber-400'
    case 'secret':
      return 'bg-fuchsia-500 dark:bg-fuchsia-400'
    default: // info
      return 'bg-blue-500 dark:bg-blue-400'
  }
})

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
      class="fixed bottom-4 right-4 sm:right-8 z-[2000] max-w-sm w-full sm:w-96 rounded-lg border shadow-lg overflow-hidden backdrop-blur-sm transition-all duration-300 transform"
      role="alert"
      :aria-describedby="ariaDescribedBy"
      :class="[bgColor, borderColor, textColor]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <!-- Progress bar -->
      <div class="relative h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          class="absolute left-0 top-0 h-full transition-[width] ease-linear"
          :class="progressColor"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <div class="p-4">
        <!-- Header with icon and title -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0" :class="[iconColor]">
              <img
                v-if="currentNotif.imgSrc"
                class="w-6 h-6 rounded-full"
                :src="currentNotif.imgSrc"
                :alt="currentNotif.title"
              >
              <component
                :is="currentNotif.imgIcon"
                v-else
                class="w-6 h-6"
                aria-hidden="true"
              />
            </div>
            <h3
              :id="ariaDescribedBy"
              class="text-base font-semibold truncate"
              v-text="currentNotif.title"
            />
          </div>

          <!-- Close button -->
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
            :class="iconColor"
            aria-label="Close notification"
            @click="hideNotif"
          >
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <!-- Notification content -->
        <div
          v-if="currentNotif.content"
          class="mt-2 text-sm"
          :class="textColor"
          v-html="currentNotif.content"
        />

        <!-- CTA buttons -->
        <div
          v-if="currentNotif.ctaText || currentNotif.ctaLink || currentNotif.ctaAction"
          class="mt-3 flex justify-end gap-2"
        >
          <a
            v-if="currentNotif.ctaLink"
            :href="currentNotif.ctaLink"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="{
              'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500': currentNotif.type === 'info' || !currentNotif.type,
              'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500': currentNotif.type === 'warning',
              'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500': currentNotif.type === 'success',
              'bg-fuchsia-600 hover:bg-fuchsia-700 text-white focus:ring-fuchsia-500': currentNotif.type === 'secret',
            }"
          >
            {{ currentNotif.ctaText || $t("action_cta") }}
          </a>
          <button
            v-else-if="currentNotif.ctaAction"
            type="button"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="{
              'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500': currentNotif.type === 'info' || !currentNotif.type,
              'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500': currentNotif.type === 'warning',
              'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500': currentNotif.type === 'success',
              'bg-fuchsia-600 hover:bg-fuchsia-700 text-white focus:ring-fuchsia-500': currentNotif.type === 'secret',
            }"
            @click="handleCtaClick"
          >
            {{ currentNotif.ctaText || $t("action_cta") }}
          </button>
        </div>
      </div>
    </div>
  </ScaleTransition>
</template>

<style scoped>
/* Optional: Add animation for notifications */
@keyframes slide-in-right {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

#base-notif {
  animation: slide-in-right 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Improve dark mode */
@media (prefers-color-scheme: dark) {
  #base-notif {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  }
}
</style>
