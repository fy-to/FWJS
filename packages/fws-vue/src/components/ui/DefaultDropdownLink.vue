<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  handleClick?: () => void;
  label?: string;
  color?: string;
}>();

const baseClasses = `w-full px-4 py-3 flex items-center border-b opacity-60 
dark:opacity-70 outline-none text-sm  border-fv-neutral-200 dark:border-fv-neutral-600 
transition-all duration-200`;

const colorClasses = computed(() => {
  if (props.color === "danger") {
    return "text-red-500 dark:hover:text-red-50 hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900";
  } else {
    return `text-black dark:text-white active:bg-fv-neutral-100 dark:hover:bg-fv-neutral-600 
        dark:focus:bg-fv-neutral-600 hover:bg-fv-neutral-50`;
  }
});

const classes = computed(() => `${baseClasses} ${colorClasses.value}`);
</script>

<template>
  <button
    :aria-label="props.label"
    @click.prevent="props.handleClick"
    :class="classes"
    role="menuitem"
    type="button"
  >
    <slot></slot>
  </button>
</template>
