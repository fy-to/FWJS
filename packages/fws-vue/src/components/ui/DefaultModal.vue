<script setup lang="ts">
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
let focusableElements: HTMLElement[] = []

// Trap focus within modal for accessibility
function getFocusableElements(element: HTMLElement): HTMLElement[] {
  return Array.from(
    element.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  ) as HTMLElement[]
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isOpen.value) return

  // Close on escape
  if (event.key === 'Escape') {
    event.preventDefault()
    setModal(false)
    return
  }

  // Handle tab trapping
  if (event.key === 'Tab' && focusableElements.length > 0) {
    // If shift + tab on first element, focus last element
    if (event.shiftKey && document.activeElement === focusableElements[0]) {
      event.preventDefault()
      focusableElements[focusableElements.length - 1].focus()
    }
    // If tab on last element, focus first element
    else if (!event.shiftKey && document.activeElement === focusableElements[focusableElements.length - 1]) {
      event.preventDefault()
      focusableElements[0].focus()
    }
  }
}

function setModal(value: boolean) {
  if (value === true) {
    if (props.onOpen) props.onOpen()
    previouslyFocusedElement = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden' // Prevent scrolling when modal is open
    document.addEventListener('keydown', handleKeyDown)
  }
  if (value === false) {
    if (props.onClose) props.onClose()
    document.body.style.overflow = '' // Restore scrolling
    document.removeEventListener('keydown', handleKeyDown)
    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
    }
  }
  isOpen.value = value
}

// After modal is opened, set focus and collect focusable elements
watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick()
    if (modalRef.value) {
      focusableElements = getFocusableElements(modalRef.value)

      // Focus the first focusable element or the close button if available
      const closeButton = modalRef.value.querySelector('button[aria-label="Close modal"]') as HTMLElement
      if (closeButton) {
        closeButton.focus()
      }
      else if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
      else {
        // If no focusable elements, focus the modal itself
        modalRef.value.focus()
      }
    }
  }
})

onMounted(() => {
  eventBus.on(`${props.id}Modal`, setModal)
})

onUnmounted(() => {
  eventBus.off(`${props.id}Modal`, setModal)
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = '' // Ensure body scrolling is restored
})

// Click outside to close
function handleBackdropClick(event: MouseEvent) {
  // Close only if clicking the backdrop, not the modal content
  if (event.target === event.currentTarget) {
    setModal(false)
  }
}
</script>

<template>
  <transition
    enter-active-class="duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 overflow-y-auto"
      style="z-index: 40"
      role="dialog"
      :aria-labelledby="title ? `${props.id}-title` : undefined"
      aria-modal="true"
    >
      <!-- Backdrop with click to close functionality -->
      <div
        class="flex absolute backdrop-blur-[8px] inset-0 flex-col items-center justify-center min-h-screen text-fv-neutral-800 dark:text-fv-neutral-300 bg-fv-neutral-900/[.20] dark:bg-fv-neutral-50/[.20]"
        style="z-index: 41"
        @click="handleBackdropClick"
      >
        <!-- Modal panel -->
        <div
          ref="modalRef"
          :class="`relative ${mSize} max-w-6xl max-h-full ${ofy} bg-white rounded-lg shadow dark:bg-fv-neutral-900`"
          style="z-index: 42"
          tabindex="-1"
          @click.stop
        >
          <!-- Header with title if provided -->
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
          <!-- Content area -->
          <div class="p-3 space-y-3">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
