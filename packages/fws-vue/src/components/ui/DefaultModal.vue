<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { computed, h, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
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
    ofy: 'overflow-y-auto cool-scroll-modal',
  },
)

const eventBus = useEventBus()

const isOpen = ref<boolean>(false)
const modalRef = shallowRef<HTMLElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null
let focusableElements: HTMLElement[] = []

// Dynamic z-index to ensure the most recently opened modal is on top
// Base z-index between 40 and 60 as required
const baseZIndex = 40 // Starting z-index value
const zIndex = ref<number>(baseZIndex)

// Cache the modal ID to avoid repeated string concatenation
const modalId = shallowRef(`${props.id}Modal`)
const modalUniqueId = shallowRef('')

// Trap focus within modal for accessibility - memoize selector for better performance
const focusableSelector = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'

// Mobile-optimized backdrop classes
const backdropClasses = 'flex fixed backdrop-blur-[8px] inset-0 flex-col items-center py-4 md:py-8 px-2 md:px-4 overflow-y-auto text-fv-neutral-800 dark:text-fv-neutral-300 bg-fv-neutral-900/[.20] dark:bg-fv-neutral-50/[.20]'

// Modal panel classes with mobile optimization
const modalPanelClasses = computed(() => {
  return `relative ${props.mSize} max-w-[calc(100vw-1rem)] md:max-w-6xl max-h-[85vh] my-auto px-0 box-border bg-white rounded-lg shadow-xl dark:bg-fv-neutral-900 flex flex-col`
})

function getFocusableElements(element: HTMLElement): HTMLElement[] {
  return Array.from(
    element.querySelectorAll(focusableSelector),
  ).filter(
    el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  ) as HTMLElement[]
}

// Forward declare setModal to avoid use-before-define
let setModal: any

// Memoize keydown handler for better performance
const handleKeyDown = useDebounceFn((event: KeyboardEvent) => {
  // Only handle events for the top-most modal
  if (!isOpen.value) return

  // Check if this modal is the top-most one
  const isTopMost = isTopMostModal(modalUniqueId.value)
  if (!isTopMost) {
    return
  }

  // Close on escape
  if (event.key === 'Escape') {
    event.preventDefault()
    setModal(false)
    return
  }

  // Handle tab trapping only if we have focusable elements
  if (event.key === 'Tab' && focusableElements.length > 0) {
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    // If shift + tab on first element, focus last element
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
    // If tab on last element, focus first element
    else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}, 10)

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

setModal = useDebounceFn((value: boolean) => {
  if (value === true) {
    if (props.onOpen) props.onOpen()
    previouslyFocusedElement = document.activeElement as HTMLElement

    // Get the next z-index from the global registry
    const newZIndex = modalRegistry.getNextZIndex()

    // Register this modal in the global registry with a unique ID
    const uniqueId = `${props.id}-${Date.now()}`
    modalUniqueId.value = uniqueId
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

    // Set up keyboard listener directly
    useEventListener(document, 'keydown', handleKeyDown)
  }
  if (value === false) {
    if (props.onClose) props.onClose()

    // Find and remove this modal from the registry
    if (modalUniqueId.value) {
      modalRegistry.modals.delete(modalUniqueId.value)
    }

    if (previouslyFocusedElement) {
      previouslyFocusedElement.focus()
    }
  }
  isOpen.value = value
}, 50)

// After modal is opened, set focus and collect focusable elements
watch(isOpen, async (newVal) => {
  if (newVal) {
    await nextTick()
    const modalEl = modalRef.value
    if (modalEl) {
      focusableElements = getFocusableElements(modalEl)

      // Focus the close button or first focusable element
      requestAnimationFrame(() => {
        const closeButton = modalEl.querySelector('button[aria-label="Close modal"]') as HTMLElement
        if (closeButton) {
          closeButton.focus()
        }
        else if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
        else {
          // If no focusable elements, focus the modal itself
          modalEl.focus()
        }
      })
    }
  }
})

onMounted(() => {
  eventBus.on(modalId.value, setModal)
})

onUnmounted(() => {
  eventBus.off(modalId.value, setModal)

  // Clean up the modal registry if this modal was open when unmounted
  if (isOpen.value && modalUniqueId.value) {
    modalRegistry.modals.delete(modalUniqueId.value)
  }
})

// Click outside to close - use debounce to prevent accidental double-clicks
const handleBackdropClick = useDebounceFn((event: MouseEvent) => {
  // Close only if clicking the backdrop, not the modal content
  if (event.target === event.currentTarget) {
    setModal(false)
  }
}, 200)
</script>

<template>
  <ClientOnly>
    <transition
      enter-active-class="duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0"
        :style="{ zIndex }"
        role="dialog"
        :aria-labelledby="title ? `${props.id}-title` : undefined"
        aria-modal="true"
        data-modal-active="true"
        :data-modal-id="props.id"
      >
        <!-- Backdrop with click to close functionality -->
        <div
          :class="backdropClasses"
          :style="{ zIndex }"
          @click="handleBackdropClick"
        >
          <!-- Modal panel -->
          <div
            ref="modalRef"
            :class="modalPanelClasses"
            :style="{ zIndex }"
            tabindex="-1"
            @click.stop
          >
            <!-- Header with title if provided -->
            <div
              v-if="title"
              class="flex items-center justify-between p-2 md:p-3 w-full border-b rounded-t dark:border-fv-neutral-700"
            >
              <slot name="before" />
              <h2
                v-if="title"
                :id="`${props.id}-title`"
                class="text-lg md:text-xl font-semibold text-fv-neutral-900 dark:text-white"
                v-html="title"
              />
              <button
                class="text-fv-neutral-400 bg-transparent hover:bg-fv-neutral-200 hover:text-fv-neutral-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-fv-neutral-600 dark:hover:text-white transition-colors duration-200"
                aria-label="Close modal"
                @click="setModal(false)"
              >
                <component :is="closeIcon" class="w-7 h-7" />
              </button>
            </div>
            <!-- Content area -->
            <div :class="`p-2 md:p-4 space-y-3 flex-grow ${ofy}`">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </ClientOnly>
</template>
