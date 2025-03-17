<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid'
import { h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEventBus } from '../../composables/event-bus'

// Use a shared global registry in the window to track all modals across instances
// This ensures proper z-index stacking even when modals are in different components
if (typeof window !== 'undefined') {
  // @ts-expect-error: TS doesn't know about the global registry
  window.__FWS_MODAL_REGISTRY = window.__FWS_MODAL_REGISTRY || {
    modals: new Map<string, number>(),
    getNextZIndex() {
      const baseZIndex = 40
      const maxZIndex = 59

      // If no modals, start at base
      if (this.modals.size === 0) {
        return baseZIndex
      }

      // Find highest z-index
      const values = Array.from(this.modals.values())
      // @ts-expect-error: TS doesn't know that values are numbers
      const highestZIndex = Math.max(...values)

      // Calculate next z-index
      const nextZIndex = highestZIndex + 1

      // If we're approaching the upper limit, reset all
      if (nextZIndex >= maxZIndex) {
        this.resetAllZIndexes()
        return baseZIndex
      }

      return nextZIndex
    },
    resetAllZIndexes() {
      // Sort by current z-index
      const entries = Array.from(this.modals.entries())
      // @ts-expect-error: TS doesn't know that entries are tuples
      entries.sort((a, b) => a[1] - b[1])

      // Reassign starting from base
      let newIndex = 40
      // @ts-expect-error: TS doesn't know that entries are tuples
      entries.forEach(([id, _]) => {
        this.modals.set(id, newIndex)
        newIndex++
      })
    },
  }
}

// @ts-expect-error: TS doesn't know about the global registry
const modalRegistry = typeof window !== 'undefined' ? window.__FWS_MODAL_REGISTRY : { modals: new Map() }

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

// Dynamic z-index to ensure the most recently opened modal is on top
// Base z-index between 40 and 60 as required
const baseZIndex = 40 // Starting z-index value
const zIndex = ref<number>(baseZIndex)

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
  // Only handle events for the top-most modal
  if (!isOpen.value) return

  // Check if this modal is the top-most one
  const isTopMost = isTopMostModal(props.id)
  if (!isTopMost) {
    return
  }

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

// Check if this modal is the top-most (highest z-index)
function isTopMostModal(id: string): boolean {
  if (modalRegistry.modals.size === 0) return false

  // Find the modal with the highest z-index
  const entries = Array.from(modalRegistry.modals.entries())
  const highestEntry = entries.reduce((prev, current) =>
    // @ts-expect-error: TS doesn't know that entries are tuples
    current[1] > prev[1] ? current : prev,
  )

  // @ts-expect-error: TS doesn't know that entries are tuples
  return highestEntry[0] === id
}

function setModal(value: boolean) {
  if (value === true) {
    if (props.onOpen) props.onOpen()
    previouslyFocusedElement = document.activeElement as HTMLElement

    // Get the next z-index from the global registry
    const newZIndex = modalRegistry.getNextZIndex()

    // Register this modal in the global registry with a unique ID (combines component id with instance id)
    const uniqueId = `${props.id}-${Date.now()}`
    modalRegistry.modals.set(uniqueId, newZIndex)

    // Store the unique ID as a data attribute for future reference
    nextTick(() => {
      const modalElement = document.querySelector(`[data-modal-id="${props.id}"]`) as HTMLElement
      if (modalElement) {
        modalElement.setAttribute('data-modal-unique-id', uniqueId)
      }
    })

    // Set this modal's z-index
    zIndex.value = newZIndex

    document.addEventListener('keydown', handleKeyDown)
  }
  if (value === false) {
    if (props.onClose) props.onClose()

    // Find and remove this modal from the registry
    const modalElement = document.querySelector(`[data-modal-id="${props.id}"]`) as HTMLElement
    if (modalElement) {
      const uniqueId = modalElement.getAttribute('data-modal-unique-id')
      if (uniqueId) {
        modalRegistry.modals.delete(uniqueId)
      }
    }

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

  // Clean up the modal registry if this modal was open when unmounted
  if (isOpen.value) {
    const modalElement = document.querySelector(`[data-modal-id="${props.id}"]`) as HTMLElement
    if (modalElement) {
      const uniqueId = modalElement.getAttribute('data-modal-unique-id')
      if (uniqueId) {
        modalRegistry.modals.delete(uniqueId)
      }
    }
  }
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
  <ClientOnly>
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
        :style="{ zIndex }"
        role="dialog"
        :aria-labelledby="title ? `${props.id}-title` : undefined"
        aria-modal="true"
        data-modal-active="true"
        :data-modal-id="props.id"
      >
        <!-- Backdrop with click to close functionality -->
        <div
          class="flex absolute backdrop-blur-[8px] inset-0 flex-col items-center justify-center min-h-screen text-fv-neutral-800 dark:text-fv-neutral-300 bg-fv-neutral-900/[.20] dark:bg-fv-neutral-50/[.20]"
          :style="{ zIndex }"
          @click="handleBackdropClick"
        >
          <!-- Modal panel -->
          <div
            ref="modalRef"
            :class="`relative ${mSize} max-w-6xl max-h-full ${ofy} bg-white rounded-lg shadow dark:bg-fv-neutral-900`"
            :style="{ zIndex }"
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
  </ClientOnly>
</template>
