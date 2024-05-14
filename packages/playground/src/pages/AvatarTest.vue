<script setup lang="ts">
import { computed } from "vue";
function stringToColor(str: string): string {
  const colors: string[] = [
    "blue",
    "red",
    "orange",
    "purple",
    "pink",
    "green",
    "cyan",
    "lime",
    "fuchsia",
  ];
  let hash: number = 0;

  for (let i: number = 0; i < str.length; i++) {
    const char: number = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const index: number = Math.abs(hash) % colors.length;
  return colors[index];
}
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: Object,
    default: () => null,
  },
  cls: {
    type: String,
    default: "small",
  },
});
const nameColor = computed(() => stringToColor(props.name));
</script>

<template>
  <div
    class="profile-avatar flex items-center justify-center relative"
    :class="`${nameColor} ${cls}`"
  >
    <template v-if="user?.UserProfile?.AvatarUUID">
      <img
        :src="`https://s.nocachenocry.com/${user?.UserProfile?.AvatarUUID}?vars=format=png:resize=240x240`"
        class="w-full h-auto rounded-full shadow-lg"
        style="aspect-ratio: 1/1"
      />
    </template>
    <template v-else>
      <span
        class="font-bold font-space"
        :class="{
          'text-7xl': cls !== 'small',
          'text-3xl': cls === 'small',
        }"
        >{{
          props.name && props.name.length >= 1
            ? props.name[0].toUpperCase()
            : ""
        }}</span
      >
      <slot />
    </template>
  </div>
</template>
