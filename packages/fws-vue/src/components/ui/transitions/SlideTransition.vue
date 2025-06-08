<script setup lang="ts">
const props = defineProps<{
  animation: string
}>()
</script>

<template>
  <Transition :name="props.animation" mode="out-in">
    <slot />
  </Transition>
</template>

<style scoped>
/* slide left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* slide right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* slide up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* slide down */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-50px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}

/* shelf up */
.shelf-up-enter-active,
.shelf-up-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.shelf-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.shelf-up-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* shelf down */
.shelf-down-enter-active,
.shelf-down-leave-active {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.shelf-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.shelf-down-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
