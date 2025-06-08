<template>
  <Transition name="expand">
    <slot />
  </Transition>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
  will-change: transform, opacity;
}

.expand-enter-from {
  transform: scale(0.9) scaleY(0);
  opacity: 0;
}

.expand-leave-to {
  transform: scale(0.9) scaleY(0);
  opacity: 0;
}
</style>
