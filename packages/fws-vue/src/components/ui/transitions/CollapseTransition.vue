<template>
  <Transition name="collapse">
    <slot />
  </Transition>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  will-change: transform, opacity;
}

.collapse-enter-from {
  transform: scaleY(0);
  opacity: 0;
}

.collapse-leave-to {
  transform: scaleY(0);
  opacity: 0;
}
</style>
