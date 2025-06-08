<template>
  <Transition name="scale">
    <slot />
  </Transition>
</template>

<style scoped>
.scale-enter-active {
  transition: transform 100ms cubic-bezier(0, 0, 0.2, 1), opacity 100ms cubic-bezier(0, 0, 0.2, 1);
  will-change: transform, opacity;
}

.scale-leave-active {
  transition: transform 75ms cubic-bezier(0.4, 0, 1, 1), opacity 75ms cubic-bezier(0.4, 0, 1, 1);
  will-change: transform, opacity;
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
