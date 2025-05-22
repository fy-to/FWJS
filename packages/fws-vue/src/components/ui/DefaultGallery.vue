<script setup lang="ts">
import type { Component } from 'vue'
import type { APIPaging } from '../../composables/rest'
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/solid'
import {
  useDebounceFn,
  useElementSize,
  useEventListener,
  useFullscreen,
  useResizeObserver,
  useWindowSize,
} from '@vueuse/core'
import { computed, h, nextTick, onMounted, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { ClientOnly } from '../ssr/ClientOnly'
import DefaultPaging from './DefaultPaging.vue'

// Core state
const isGalleryOpen = ref<boolean>(false)
const eventBus = useEventBus()
const sidePanel = ref<boolean>(true)
const showControls = ref<boolean>(true)
const isFullscreen = ref<boolean>(false)
const infoPanel = ref<boolean>(true) // Show info panel by default
const direction = ref<'next' | 'prev'>('next')

// Refs to track DOM elements and their sizes
const galleryRef = shallowRef<HTMLElement | null>(null)
const galleryContentRef = shallowRef<HTMLElement | null>(null)
const imageContainerRef = shallowRef<HTMLElement | null>(null)
const infoPanelRef = shallowRef<HTMLElement | null>(null)
const sidePanelRef = shallowRef<HTMLElement | null>(null)
const topControlsRef = shallowRef<HTMLElement | null>(null)

// Use VueUse's useElementSize for reliable sizing
const { width: galleryWidth, height: galleryHeight } = useElementSize(galleryRef)
const { width: windowWidth, height: windowHeight } = useWindowSize()
const { height: topControlsHeight } = useElementSize(topControlsRef)
const { height: infoPanelHeight } = useElementSize(infoPanelRef)

// Use VueUse's useFullscreen for better fullscreen handling
const { isFullscreen: isElementFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen(galleryRef)

// Track when fullscreen changes externally (like Escape key)
watch(isElementFullscreen, (newValue) => {
  isFullscreen.value = newValue
})

// Touch handling state
const touchStartTime = ref<number>(0)
const start = reactive({ x: 0, y: 0 })
const isKeyPressed = ref<boolean>(false)

// Timers for automatic control hiding
let controlsTimeout: number | null = null
let fullscreenResizeTimeout: number | null = null

// Props definition with defaults
const props = withDefaults(
  defineProps<{
    id: string
    images: Array<any>
    title?: string
    getImageUrl?: Function
    getThumbnailUrl?: Function
    onOpen?: Function
    onClose?: Function
    closeIcon?: object
    gridHeight?: number
    mode: 'mason' | 'grid' | 'button' | 'hidden' | 'custom'
    paging?: APIPaging | undefined
    buttonText?: string
    buttonType?: string
    modelValue: number
    borderColor?: Function
    imageLoader: string
    videoComponent?: Component | string
    imageComponent?: Component | string
    isVideo?: Function
    ranking?: boolean
  }>(),
  {
    modelValue: 0,
    imageComponent: 'img',
    mode: 'grid',
    gridHeight: 4,
    closeIcon: () => h(XMarkIcon),
    images: () => [],
    isVideo: () => false,
    getImageUrl: (image: any) => image.image_url,
    getThumbnailUrl: (image: any) => `${image.image_url}?s=250x250&m=autocrop`,
    paging: undefined,
    borderColor: undefined,
    ranking: false,
  },
)

// Emits
const emit = defineEmits(['update:modelValue'])

// Two-way binding for model value
const modelValue = computed({
  get: () => props.modelValue,
  set: (i) => {
    emit('update:modelValue', i)
  },
})

// Computed values
const modelValueSrc = computed(() => {
  if (props.images.length === 0) return false
  if (props.images[modelValue.value] === undefined) return false
  return props.getImageUrl(props.images[modelValue.value])
})

const currentImage = computed(() => {
  if (props.images.length === 0) return null
  return props.images[modelValue.value]
})

const imageCount = computed(() => props.images.length)
const currentIndex = computed(() => modelValue.value + 1)

/**
 * Dynamically update the size of the displayed image/video
 * so it fits inside the viewport, taking into account:
 * - Top controls
 * - Info panel (if open)
 * - Side panel (if open)
 * - A little padding
 */
const updateImageSizes = useDebounceFn(() => {
  // Only adjust if gallery is open
  if (!isGalleryOpen.value) return

  // Find the container and the main media element (img or video)
  const container = document.querySelector('.image-display') as HTMLDivElement
  if (!container) return
  const mainMedia = container.querySelector('img, video') as HTMLElement | null
  if (!mainMedia) return

  // Standard padding
  const padding = 24

  // Side panel width if visible
  const sidebarWidth = sidePanel.value ? 256 : 0

  // Calculate available width
  const availableWidth = windowWidth.value - sidebarWidth - padding * 2

  // Set max width
  mainMedia.style.maxWidth
    = windowWidth.value <= 768 ? '90vw' : `${availableWidth}px`

  // Preserve aspect ratio; let height be auto
  mainMedia.style.height = 'auto'

  // Deduct top controls height + info panel height (if open) + padding
  const topSpace = topControlsHeight.value || 0
  const infoSpace = infoPanel.value ? (infoPanelHeight.value || 0) : 0
  const availableHeight = windowHeight.value - topSpace - infoSpace - padding * 2

  mainMedia.style.maxHeight = `${availableHeight}px`
}, 50)

// Modal controls
function setModal(value: boolean) {
  if (value === true) {
    if (props.onOpen) props.onOpen()
    document.body.style.overflow = 'hidden' // Prevent scrolling when gallery is open

    if (!import.meta.env.SSR) {
      useEventListener(document, 'keydown', handleKeyboardInput)
      useEventListener(document, 'keyup', handleKeyboardRelease)
    }
  }
  else {
    if (props.onClose) props.onClose()
    document.body.style.overflow = '' // Restore scrolling

    // Exit fullscreen if active
    if (isFullscreen.value) {
      exitFullscreen()
      isFullscreen.value = false
    }

    // Clear timeout if modal is closed
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      controlsTimeout = null
    }
  }
  isGalleryOpen.value = value
  showControls.value = true
}

// Open gallery with debounce to prevent accidental double-clicks
const openGalleryImage = useDebounceFn((index: number | undefined) => {
  if (index === undefined) {
    modelValue.value = 0
  }
  else {
    modelValue.value = Number.parseInt(index.toString())
  }
  setModal(true)

  // Update layout after opening
  nextTick(() => {
    updateImageSizes()
  })
}, 50)

// Navigation functions
function goNextImage() {
  direction.value = 'next'
  if (modelValue.value < props.images.length - 1) {
    modelValue.value++
  }
  else {
    modelValue.value = 0
  }
  resetControlsTimer()

  nextTick(() => {
    updateImageSizes()
  })
}

function goPrevImage() {
  direction.value = 'prev'
  if (modelValue.value > 0) {
    modelValue.value--
  }
  else {
    modelValue.value = props.images.length - 1 > 0 ? props.images.length - 1 : 0
  }
  resetControlsTimer()

  nextTick(() => {
    updateImageSizes()
  })
}

// UI control functions
function resetControlsTimer() {
  // Always show controls - no auto-hide
  showControls.value = true
}

function toggleInfoPanel() {
  infoPanel.value = !infoPanel.value
  resetControlsTimer()

  // Update layout immediately AND after nextTick to ensure DOM updates
  updateImageSizes()

  nextTick(() => {
    updateImageSizes()
    // Additional delayed updates to catch transitions
    setTimeout(() => updateImageSizes(), 50)
    setTimeout(() => updateImageSizes(), 300)
  })
}

function toggleSidePanel() {
  sidePanel.value = !sidePanel.value
  resetControlsTimer()

  nextTick(() => {
    updateImageSizes()
  })
}

function toggleFullscreen() {
  if (!isFullscreen.value) {
    if (galleryRef.value) {
      enterFullscreen()
        .then(() => {
          isFullscreen.value = true
          if (fullscreenResizeTimeout) clearTimeout(fullscreenResizeTimeout)
          fullscreenResizeTimeout = window.setTimeout(() => {
            updateImageSizes()
          }, 50)
        })
        .catch(() => {})
    }
  }
  else {
    exitFullscreen()
      .then(() => {
        isFullscreen.value = false
        if (fullscreenResizeTimeout) clearTimeout(fullscreenResizeTimeout)
        fullscreenResizeTimeout = window.setTimeout(() => {
          updateImageSizes()
        }, 50)
      })
      .catch(() => {})
  }
  resetControlsTimer()
}

// Touch handling with debounce to prevent multiple rapid changes
const touchStart = useDebounceFn((event: TouchEvent) => {
  const touch = event.touches[0]
  const targetElement = touch.target as HTMLElement

  touchStartTime.value = Date.now()

  // Ignore swipes if starting on an interactive element
  if (targetElement.closest('button, a, input, textarea, select')) {
    return
  }

  start.x = touch.screenX
  start.y = touch.screenY
}, 50)

const touchEnd = useDebounceFn((event: TouchEvent) => {
  const touch = event.changedTouches[0]
  const targetElement = touch.target as HTMLElement
  const touchDuration = Date.now() - touchStartTime.value

  // Ignore swipes if ending on an interactive element
  if (targetElement.closest('button, a, input, textarea, select')) {
    return
  }

  const end = { x: touch.screenX, y: touch.screenY }

  const diffX = start.x - end.x
  const diffY = start.y - end.y

  // If it's a quick tap (not a swipe), do nothing
  if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && touchDuration < 300) {
    return
  }

  // Left/right swipe
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    if (diffX > 0) {
      goNextImage()
    }
    else {
      goPrevImage()
    }
  }
}, 50)

// Border color function
function getBorderColor(i: any) {
  if (props.borderColor !== undefined) {
    return props.borderColor(i)
  }
  return ''
}

// Keyboard handlers
function handleKeyboardInput(event: KeyboardEvent) {
  if (!isGalleryOpen.value) return
  if (isKeyPressed.value) return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      setModal(false)
      break
    case 'ArrowRight':
      isKeyPressed.value = true
      goNextImage()
      break
    case 'ArrowLeft':
      isKeyPressed.value = true
      goPrevImage()
      break
    case 'f':
      toggleFullscreen()
      break
    case 'i':
      toggleInfoPanel()
      break
    default:
      break
  }
}

function handleKeyboardRelease(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    isKeyPressed.value = false
  }
}

function closeGallery() {
  setModal(false)
}

// Click outside gallery content to close - with debounce
const handleBackdropClick = useDebounceFn((event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    setModal(false)
  }
}, 200)

// Watch for changes that affect sizing
watch(
  [
    currentImage,
    isFullscreen,
    infoPanel,
    sidePanel,
    windowWidth,
    windowHeight,
    galleryWidth,
    galleryHeight,
    topControlsHeight,
    infoPanelHeight,
    modelValue, // Watch for model value changes to update layout
  ],
  () => {
    updateImageSizes()
  },
)

// Lifecycle hooks
onMounted(() => {
  eventBus.on(`${props.id}GalleryImage`, openGalleryImage)
  eventBus.on(`${props.id}Gallery`, openGalleryImage)
  eventBus.on(`${props.id}GalleryClose`, closeGallery)

  // Set up observers for dynamic resizing
  if (topControlsRef.value) {
    useResizeObserver(topControlsRef.value, updateImageSizes)
  }

  if (infoPanelRef.value) {
    useResizeObserver(infoPanelRef.value, updateImageSizes)
  }

  if (sidePanelRef.value) {
    useResizeObserver(sidePanelRef.value, updateImageSizes)
  }

  // Listen for fullscreen changes
  useEventListener(document, 'fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
    nextTick(() => {
      updateImageSizes()
    })
  })
})

onUnmounted(() => {
  eventBus.off(`${props.id}Gallery`, openGalleryImage)
  eventBus.off(`${props.id}GalleryImage`, openGalleryImage)
  eventBus.off(`${props.id}GalleryClose`, closeGallery)

  if (!import.meta.env.SSR) {
    document.body.style.overflow = '' // Restore scrolling
  }

  // Clear any remaining timeouts
  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }

  if (fullscreenResizeTimeout) {
    clearTimeout(fullscreenResizeTimeout)
  }

  // Ensure we exit fullscreen mode on unmount
  if (isFullscreen.value) {
    exitFullscreen().catch(() => {})
  }
})
</script>

<template>
  <div>
    <transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isGalleryOpen"
        ref="galleryRef"
        class="fixed bg-fv-neutral-900 text-white inset-0 max-w-[100vw] max-h-[100vh] overflow-hidden gallery-container"
        style="z-index: 37"
        role="dialog"
        aria-modal="true"
        @click="handleBackdropClick"
      >
        <!-- Top Controls Bar -->
        <transition
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-300"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showControls"
            ref="topControlsRef"
            class="fixed top-0 left-0 right-0 px-4 py-2 flex justify-between items-center bg-fv-neutral-900/90 backdrop-blur-sm z-50 controls-bar"
          >
            <!-- Title and Counter -->
            <div class="flex items-center space-x-2">
              <span v-if="title" class="font-medium text-lg">{{ title }}</span>
              <span class="text-sm opacity-80">{{ currentIndex }} / {{ imageCount }}</span>
            </div>

            <!-- Control Buttons -->
            <div class="flex items-center space-x-2">
              <button
                class="btn p-1.5 rounded-full bg-fv-neutral-800/70 hover:bg-fv-neutral-700/90 transition-transform transform hover:scale-110"
                :class="{ 'bg-fv-primary-500/70': infoPanel }"
                :title="infoPanel ? 'Hide info' : 'Show info'"
                @click="toggleInfoPanel"
              >
                <InformationCircleIcon class="w-5 h-5" />
              </button>

              <button
                class="btn p-1.5 rounded-full bg-fv-neutral-800/70 hover:bg-fv-neutral-700/90 transition-transform transform hover:scale-110"
                :title="sidePanel ? 'Hide thumbnails' : 'Show thumbnails'"
                @click="toggleSidePanel"
              >
                <ChevronDoubleRightIcon v-if="sidePanel" class="w-5 h-5" />
                <ChevronDoubleLeftIcon v-else class="w-5 h-5" />
              </button>

              <button
                class="btn p-1.5 rounded-full bg-fv-neutral-800/70 hover:bg-fv-neutral-700/90 transition-transform transform hover:scale-110"
                aria-label="Close gallery"
                @click="setModal(false)"
              >
                <component :is="closeIcon" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </transition>

        <!-- Main Gallery Content -->
        <div
          ref="galleryContentRef"
          class="w-full h-full flex flex-col lg:flex-row"
        >
          <!-- Main Image Area -->
          <div
            class="relative flex-1 h-full flex flex-col"
            :style="{ paddingTop: `${topControlsHeight}px` }"
            :class="{ 'lg:pr-64': sidePanel, 'lg:max-w-[calc(100%-16rem)]': sidePanel }"
            style="max-width: 100%;"
          >
            <!-- Left Navigation (Previous) -->
            <transition
              enter-active-class="transition-opacity duration-300"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-300"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showControls && images.length > 1"
                class="absolute left-0 z-40 h-full flex items-center px-2 md:px-4"
              >
                <button
                  class="btn bg-fv-neutral-800/70 hover:bg-fv-neutral-700/90 backdrop-blur-sm p-2 rounded-full transition-transform transform hover:scale-110"
                  aria-label="Previous image"
                  @click="goPrevImage()"
                >
                  <ChevronLeftIcon class="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
            </transition>

            <!-- Image/Video Container -->
            <div
              ref="imageContainerRef"
              class="flex-grow flex items-center justify-center"
              @touchstart="touchStart"
              @touchend="touchEnd"
            >
              <transition
                :name="direction === 'next' ? 'slide-next' : 'slide-prev'"
                mode="out-in"
                @before-enter="updateImageSizes"
                @after-leave="updateImageSizes"
              >
                <div
                  :key="`image-display-${modelValue}`"
                  class="image-display relative w-full h-full flex flex-col items-center justify-center"
                >
                  <!-- If video -->
                  <template v-if="videoComponent && isVideo(images[modelValue])">
                    <ClientOnly>
                      <component
                        :is="videoComponent"
                        :src="isVideo(images[modelValue])"
                        class="shadow max-w-full h-auto object-contain video-component"
                        @loadedmetadata="updateImageSizes"
                        @loadeddata="updateImageSizes"
                      />
                    </ClientOnly>
                  </template>
                  <!-- Otherwise, image -->
                  <template v-else>
                    <img
                      v-if="modelValueSrc && imageComponent === 'img'"
                      class="shadow max-w-full h-auto object-contain"
                      :src="modelValueSrc"
                      :alt="`Gallery image ${modelValue + 1}`"
                      @load="updateImageSizes"
                    >
                    <component
                      :is="imageComponent"
                      v-else-if="modelValueSrc && imageComponent"
                      :image="modelValueSrc.image"
                      :variant="modelValueSrc.variant"
                      :alt="modelValueSrc.alt"
                      class="shadow max-w-full h-auto object-contain"
                    />
                  </template>
                </div>
              </transition>
            </div>

            <!-- Right Navigation (Next) -->
            <transition
              enter-active-class="transition-opacity duration-300"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-300"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showControls && images.length > 1"
                class="absolute right-0 z-40 h-full flex items-center px-2 md:px-4"
                :class="{ 'lg:mr-64': sidePanel }"
              >
                <button
                  class="btn bg-fv-neutral-800/70 hover:bg-fv-neutral-700/90 backdrop-blur-sm p-2 rounded-full transition-transform transform hover:scale-110"
                  aria-label="Next image"
                  @click="goNextImage()"
                >
                  <ChevronRightIcon class="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>
            </transition>

            <!-- Info Panel -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform translate-y-4"
            >
              <div
                v-if="infoPanel && images[modelValue]"
                ref="infoPanelRef"
                class="w-full px-4 py-3 backdrop-blur-md bg-fv-neutral-900/80 border-t border-fv-neutral-800"
              >
                <slot :value="images[modelValue]" />
              </div>
            </transition>
          </div>

          <!-- Side Thumbnails Panel (Desktop) -->
          <transition
            enter-active-class="transform transition ease-in-out duration-300"
            enter-from-class="translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transform transition ease-in-out duration-300"
            leave-from-class="translate-x-0"
            leave-to-class="translate-x-full"
          >
            <div
              v-if="sidePanel"
              ref="sidePanelRef"
              class="side-panel hidden lg:block absolute right-0 top-0 bottom-0 w-64 overflow-y-auto z-40 cool-scroll"
              :style="{ paddingTop: `${topControlsHeight + 8}px` }"
            >
              <!-- Paging Controls -->
              <div v-if="paging" class="flex items-center justify-center pt-2">
                <DefaultPaging :id="id" :items="paging" />
              </div>

              <!-- Thumbnails -->
              <div class="grid grid-cols-2 gap-2 p-2">
                <div
                  v-for="i in images.length"
                  :key="`bg_${id}_${i}`"
                  class="group relative"
                >
                  <div
                    class="absolute inset-0 rounded-lg transition-colors duration-300 group-hover:bg-fv-neutral-700/40"
                    :class="{ 'bg-fv-primary-500/40': i - 1 === modelValue }"
                  />
                  <img
                    v-if="imageComponent === 'img'"
                    :class="`h-auto max-w-full rounded-lg cursor-pointer shadow transition-all duration-300 group-hover:brightness-110 ${getBorderColor(
                      images[i - 1],
                    )}`"
                    :style="{
                      filter:
                        i - 1 === modelValue ? 'brightness(1)' : 'brightness(0.7)',
                    }"
                    :src="getThumbnailUrl(images[i - 1])"
                    :alt="`Thumbnail ${i}`"
                    @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
                  >
                  <component
                    :is="imageComponent"
                    v-else
                    :image="getThumbnailUrl(images[i - 1]).image"
                    :variant="getThumbnailUrl(images[i - 1]).variant"
                    :alt="getThumbnailUrl(images[i - 1]).alt"
                    :class="`h-auto max-w-full rounded-lg cursor-pointer shadow transition-all duration-300 group-hover:brightness-110 ${getBorderColor(
                      images[i - 1],
                    )}`"
                    :style="{
                      filter:
                        i - 1 === modelValue ? 'brightness(1)' : 'brightness(0.7)',
                    }"
                    :likes="getThumbnailUrl(images[i - 1]).likes"
                    :show-likes="getThumbnailUrl(images[i - 1]).showLikes"
                    :is-author="getThumbnailUrl(images[i - 1]).isAuthor"
                    :user-uuid="getThumbnailUrl(images[i - 1]).userUUID"
                    @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
                  />
                </div>
              </div>
            </div>
          </transition>

          <!-- Mobile Thumbnail Row (Bottom) -->
          <transition
            enter-active-class="transition-transform duration-300 ease-out"
            enter-from-class="translate-y-full"
            enter-to-class="translate-y-0"
            leave-active-class="transition-transform duration-300 ease-in"
            leave-from-class="translate-y-0"
            leave-to-class="translate-y-full"
          >
            <div
              v-if="showControls && images.length > 1 && !sidePanel"
              class="absolute bottom-0 left-0 right-0 p-1 lg:hidden bg-gradient-to-t from-fv-neutral-900/90 to-transparent backdrop-blur-sm z-45"
              :class="{ 'pb-4': infoPanel, 'pb-2': !infoPanel }"
              @touchstart.stop
              @touchmove.stop
              @touchend.stop
            >
              <div class="overflow-x-auto flex space-x-2 px-1 no-scrollbar">
                <div
                  v-for="(image, idx) in images"
                  :key="`mobile_thumb_${id}_${idx}`"
                  class="flex-shrink-0 w-16 h-16 rounded-lg relative cursor-pointer"
                  :class="{ 'ring-2 ring-fv-primary-500 ring-offset-1 ring-offset-fv-neutral-900': idx === modelValue }"
                  @click="$eventBus.emit(`${id}GalleryImage`, idx)"
                >
                  <img
                    v-if="imageComponent === 'img'"
                    class="w-full h-full object-cover rounded-lg transition duration-200"
                    :style="{
                      filter: idx === modelValue ? 'brightness(1)' : 'brightness(0.7)',
                    }"
                    :src="getThumbnailUrl(image)"
                    :alt="`Thumbnail ${idx + 1}`"
                  >
                  <component
                    :is="imageComponent"
                    v-else
                    :image="getThumbnailUrl(image).image"
                    :variant="getThumbnailUrl(image).variant"
                    :alt="getThumbnailUrl(image).alt"
                    class="w-full h-full object-cover rounded-lg transition duration-200"
                    :style="{
                      filter: idx === modelValue ? 'brightness(1)' : 'brightness(0.7)',
                    }"
                  />
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>

    <!-- Thumbnail Grid/Masonry/Custom Layouts if gallery is not open -->
    <div v-if="mode === 'grid' || mode === 'mason' || mode === 'custom'" class="gallery-grid">
      <div
        :class="{
          'masonry-grid': mode === 'mason',
          'standard-grid': mode === 'grid',
          'custom-grid': mode === 'custom',
        }"
      >
        <slot name="thumbnail" />

        <!-- Iterate images -->
        <template v-for="i in images.length" :key="`g_${id}_${i}`">
          <template v-if="mode === 'mason'">
            <!-- Example naive "masonry" approach -->
            <div
              v-if="i + (1 % gridHeight) === 0"
              class="masonry-column relative"
            >
              <div v-if="ranking" class="img-gallery-ranking">
                {{ i }}
              </div>
              <template v-for="j in gridHeight" :key="`gi_${id}_${i + j}`">
                <div class="masonry-item">
                  <img
                    v-if="i + j - 2 < images.length && imageComponent === 'img'"
                    class="h-auto max-w-full w-full rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:brightness-110 hover:scale-[1.02]"
                    :src="getThumbnailUrl(images[i + j - 2])"
                    :alt="`Gallery image ${i + j - 1}`"
                    @click="$eventBus.emit(`${id}GalleryImage`, i + j - 2)"
                  >
                  <component
                    :is="imageComponent"
                    v-else-if="i + j - 2 < images.length"
                    :image="getThumbnailUrl(images[i + j - 2]).image"
                    :variant="getThumbnailUrl(images[i + j - 2]).variant"
                    :alt="getThumbnailUrl(images[i + j - 2]).alt"
                    :class="`h-auto max-w-full w-full rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:brightness-110 hover:scale-[1.02] ${getBorderColor(
                      images[i + j - 2],
                    )}`"
                    :likes="getThumbnailUrl(images[i + j - 2]).likes"
                    :show-likes="getThumbnailUrl(images[i + j - 2]).showLikes"
                    :is-author="getThumbnailUrl(images[i + j - 2]).isAuthor"
                    :user-uuid="getThumbnailUrl(images[i + j - 2]).userUUID"
                    @click="$eventBus.emit(`${id}GalleryImage`, i + j - 2)"
                  />
                </div>
              </template>
            </div>
          </template>
          <div v-else class="grid-item relative group">
            <div v-if="ranking" class="img-gallery-ranking">
              {{ i }}
            </div>
            <div class="overflow-hidden rounded-lg">
              <img
                v-if="imageComponent === 'img'"
                class="h-auto max-w-full w-full rounded-lg cursor-pointer shadow-md transition-all duration-300 group-hover:brightness-110 group-hover:scale-[1.03]"
                :src="getThumbnailUrl(images[i - 1])"
                :alt="`Gallery image ${i}`"
                @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
              >
              <component
                :is="imageComponent"
                v-else-if="imageComponent"
                :image="getThumbnailUrl(images[i - 1]).image"
                :variant="getThumbnailUrl(images[i - 1]).variant"
                :alt="getThumbnailUrl(images[i - 1]).alt"
                :class="`h-auto max-w-full w-full rounded-lg cursor-pointer shadow-md transition-all duration-300 group-hover:brightness-110 group-hover:scale-[1.03] ${getBorderColor(
                  images[i - 1],
                )}`"
                :likes="getThumbnailUrl(images[i - 1]).likes"
                :show-likes="getThumbnailUrl(images[i - 1]).showLikes"
                :is-author="getThumbnailUrl(images[i - 1]).isAuthor"
                :user-uuid="getThumbnailUrl(images[i - 1]).userUUID"
                @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Button Mode -->
    <button
      v-if="mode === 'button'"
      :class="`btn ${buttonType ? buttonType : 'primary'} defaults relative overflow-hidden group`"
      @click="openGalleryImage(0)"
    >
      <span class="relative z-10">{{ buttonText ? buttonText : $t("open_gallery_cta") }}</span>
      <span class="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    </button>
  </div>
</template>

<style scoped>
.controls-bar {
  height: auto;
}

.image-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.side-panel {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.info-panel {
  width: 100%;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

/* Transitions for next/prev images */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s,
    filter 0.15s;
}

/* Next (slide from right) */
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(30px);
  filter: blur(8px);
}
.slide-next-enter-to {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}
.slide-next-leave-from {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  filter: blur(8px);
}

/* Prev (slide from left) */
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-30px);
  filter: blur(8px);
}
.slide-prev-enter-to {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}
.slide-prev-leave-from {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(30px);
  filter: blur(8px);
}

/* Grid layouts */
.gallery-grid {
  min-height: 200px;
}

.standard-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
}
@media (min-width: 480px) {
  .standard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 768px) {
  .standard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}
@media (min-width: 1024px) {
  .standard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (min-width: 1280px) {
  .standard-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
@media (min-width: 1536px) {
  .standard-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.masonry-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
}
@media (min-width: 480px) {
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 768px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
}
@media (min-width: 1024px) {
  .masonry-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.masonry-column {
  display: grid;
  gap: 0.75rem;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 0.75rem;
}

.grid-item {
  break-inside: avoid;
  margin-bottom: 0.75rem;
}

.img-gallery-ranking {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 0.75rem;
  z-index: 10;
}

/* Hide scrollbars on mobile */
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari, and Opera */
}
</style>
