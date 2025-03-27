<script lang="ts" setup>
import { useDebounceFn } from '@vueuse/core'
import { computed } from 'vue'
import { DefaultInput } from '../..'

interface DateInterval {
  $between: [any, any]
}
const props = withDefaults(
  defineProps<{
    mode?: 'interval' | 'single'
    modelValue?: DateInterval
    id: string
    label?: string
  }>(),
  {
    mode: 'single',
    modelValue: () => {
      return { $between: [undefined, undefined] }
    },
  },
)

const emit = defineEmits(['update:modelValue'])

// Use debounced emitter to reduce update frequency
const emitUpdate = useDebounceFn((value: DateInterval) => {
  emit('update:modelValue', value)
}, 150)

const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emitUpdate(items)
  },
})
</script>

<template>
  <div v-if="mode === 'interval' && model">
    <div class="flex flex-col md:flex-row">
      <DefaultInput
        :id="`${id}_start`"
        v-model="model.$between[0]"
        type="date"
        class="w-full"
        :label="`${label} (${$t('date_selection_start')})`"
      />
      <div class="md:mx-2 flex items-center justify-center">
        <div>↭</div>
      </div>
      <DefaultInput
        :id="`${id}_end`"
        v-model="model.$between[1]"
        type="date"
        class="w-full"
        :label="`${label} (${$t('date_selection_end')})`"
      />
    </div>
  </div>
  <div v-else>
    <DefaultInput :id="id" v-model="model.$between[0]" type="date" />
  </div>
</template>
