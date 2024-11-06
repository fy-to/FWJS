<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'

const props = withDefaults(
  defineProps<{
    image: string
    force?: boolean
    id?: string
  }>(),
  {
    force: false,
    id: '',
  },
)
const eventBus = useEventBus()
const loading = ref<boolean>(false)
function setLoading(value: boolean) {
  loading.value = value
}
onMounted(() => {
  if (props.id) eventBus.on(`${props.id}-loading`, setLoading)
  else eventBus.on('loading', setLoading)
})
onUnmounted(() => {
  if (props.id) eventBus.off(`${props.id}-loading`, setLoading)
  else eventBus.off('loading', setLoading)
})
</script>

<template>
  <div
    v-if="loading || force"
    class="flex-grow flex flex-col bg-fv-neutral-200/[.8] dark:bg-fv-neutral-800/[.8] items-center justify-center absolute inset-0 z-50"
  >
    <div
      class="text-center animate-pulse w-40 h-40 p-6 rounded-full shadow bg-fv-neutral-50 dark:bg-fv-neutral-900 flex items-center justify-center"
    >
      <img
        :src="image"
        :alt="$t('global_loading')"
        class="w-full h-full relative"
      >
    </div>
  </div>
</template>
