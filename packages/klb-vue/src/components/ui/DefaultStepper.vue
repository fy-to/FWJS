<script setup lang="ts">
import type { StepperSteps } from "../../types/types";
defineProps<{
  steps: StepperSteps;
}>();
</script>
<template>
  <ol class="items-center w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0">
    <li
      class="flex items-center space-x-2.5"
      v-for="(step, i) in steps.list"
      :key="`step-${i}`"
      :class="{
        'text-fv-primary-600 dark:text-fv-primary-500': i + 1 == steps.current,
        'text-fv-neutral-500 dark:text-fv-neutral-400': i + 1 != steps.current,
      }"
    >
      <span
        class="flex items-center justify-center w-8 h-8 border rounded-full shrink-0"
        :class="{
          'text-fv-primary-600 dark:text-fv-primary-500 border-fv-primary-600 dark:border-fv-primary-500':
            i + 1 == steps.current,
          'text-fv-neutral-500 dark:text-fv-neutral-400  border-fv-neutral-600 dark:border-fv-neutral-500':
            i + 1 != steps.current,
        }"
      >
        {{ i + 1 }}
      </span>
      <span>
        <h3 class="font-medium leading-tight">{{ step.title }}</h3>
        <p class="text-sm" v-if="step.description">{{ step.description }}</p>
      </span>
    </li>
  </ol>
</template>
