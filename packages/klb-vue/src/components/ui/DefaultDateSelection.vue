<script lang="ts" setup>
import { computed } from "vue";
import { DefaultInput } from "../..";
interface DateInterval {
  $between: [any, any];
}
const props = withDefaults(
  defineProps<{
    mode?: "interval" | "single";
    modelValue?: DateInterval;
    id: string;
    label?: string;
  }>(),
  {
    mode: "single",
    modelValue: () => {
      return { $between: [undefined, undefined] };
    },
  },
);

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emit("update:modelValue", items);
  },
});
</script>
<template>
  <div v-if="mode == 'interval' && model">
    <div class="flex flex-col md:flex-row">
      <DefaultInput
        v-model="model.$between[0]"
        type="date"
        :id="`${id}_start`"
        class="w-full"
        :label="`${label} (${$t('date_selection_start')})`"
      />
      <div class="md:mx-2 flex items-center justify-center">
        <div>↭</div>
      </div>
      <DefaultInput
        v-model="model.$between[1]"
        type="date"
        class="w-full"
        :id="`${id}_end`"
        :label="`${label} (${$t('date_selection_end')})`"
      />
    </div>
  </div>
  <div v-else>
    <DefaultInput v-model="model.$between[0]" type="date" :id="id" />
  </div>
</template>
