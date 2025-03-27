<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  handleClick?: () => void
  label?: string
  color?: string
}>()

// Fixed class strings to avoid string recreation on each render
const baseClasses = `w-full px-4 py-3 flex items-center border-b opacity-60 
dark:opacity-70 outline-none text-sm border-fv-neutral-200 dark:border-fv-neutral-600 
transition-all duration-200`

// Cache color classes to avoid recomputation
const dangerClasses = 'text-red-500 dark:hover:text-red-50 hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900'
const defaultClasses = `text-black dark:text-white active:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 
dark:focus:bg-fv-neutral-600 hover:bg-fv-neutral-50`

// Memoize color classes
const colorClasses = computed(() =>
  props.color === 'danger' ? dangerClasses : defaultClasses,
)

// Memoize final classes to avoid string concatenation on each render
const classes = computed(() => `${baseClasses} ${colorClasses.value}`)

// Debounce click handler to prevent rapid clicks
const debouncedClick = props.handleClick
  ? useDebounceFn(props.handleClick, 150)
  : undefined
</script>

<template>
  <button
    :aria-label="props.label"
    :class="classes"
    role="menuitem"
    type="button"
    @click.prevent="debouncedClick || props.handleClick"
  >
    <slot />
  </button>
</template>
