<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

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

function handleCloseOnEscape(event: KeyboardEvent) {
  if (['Escape', 'Esc'].includes(event.key)) {
    props.closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleCloseOnEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleCloseOnEscape)
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
        v-click-outside="props.handleClickOutside"
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
