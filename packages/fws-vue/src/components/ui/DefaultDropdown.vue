<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { onMounted, shallowRef } from 'vue'
import ScaleTransition from './transitions/ScaleTransition.vue'

const props = defineProps<{
  show: boolean
  handleClickOutside: any
  preventClickOutside?: boolean
  coordinates?: {
    left?: string
    right?: string
    top?: string
    bottom?: string
  }
  position: string[]
  closeDropdown: () => void
}>()

const dropdownRef = shallowRef<HTMLElement | null>(null)

// Use VueUse's onClickOutside for more efficient click handling
onMounted(() => {
  onClickOutside(dropdownRef, (_event) => {
    if (!props.preventClickOutside && props.show) {
      props.handleClickOutside()
    }
  })

  // Use VueUse's useEventListener for cleaner event management
  useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (['Escape', 'Esc'].includes(event.key) && props.show) {
      props.closeDropdown()
    }
  })
})
</script>

<template>
  <div>
    <div
      v-if="props.show"
      class="fixed left-0 top-0 z-[50] w-full h-full"
    />

    <ScaleTransition>
      <div
        v-show="props.show"
        ref="dropdownRef"
        :class="props.position"
        :style="props.coordinates"
        class="absolute z-[100] w-[200px] mt-2 rounded-sm bg-white dark:bg-fv-neutral-900 shadow-lg border border-fv-neutral-100 dark:border-fv-neutral-600 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabindex="-1"
      >
        <div role="none">
          <slot />
        </div>
      </div>
    </ScaleTransition>
  </div>
</template>
