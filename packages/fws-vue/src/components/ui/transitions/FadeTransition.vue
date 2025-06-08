<template>
  <Transition name="fade" mode="out-in">
    <slot />
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms cubic-bezier(0.4, 0, 1, 1);
  will-change: opacity;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
