<script setup lang="ts">
import { LinkIcon } from "@heroicons/vue/24/solid";
import { computed, ref, toRef } from "vue";
import type { ErrorObject } from "@vuelidate/core";
import { useTranslation } from "../../translations";
type modelValueType = string | number | string[] | undefined;
type checkboxValueType = any[] | Set<any> | undefined | boolean;
const props = withDefaults(
  defineProps<{
    id: string;
    showLabel?: boolean;
    label?: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    checkboxTrueValue?: string | boolean;
    checkboxFalseValue?: string | boolean;
    req?: boolean;
    linkIcon?: string;
    modelValue?: modelValueType;
    checkboxValue?: checkboxValueType;
    options?: string[][];
    help?: string;
    error?: string;
    errorVuelidate?: ErrorObject[];
    disabled?: boolean;
  }>(),
  {
    showLabel: true,
    type: "text",
    req: false,
    options: () => [],
    checkboxTrueValue: true,
    checkboxFalseValue: false,
    disabled: false,
  },
);
const translate = useTranslation();
const inputRef = ref<HTMLInputElement>();
const errorProps = toRef(props, "error");
const errorVuelidateProps = toRef(props, "errorVuelidate");

const checkErrors = computed(() => {
  if (errorProps.value) return errorProps.value;
  if (errorVuelidateProps.value && errorVuelidateProps.value.length > 0) {
    const err = `vuelidate_validator_${errorVuelidateProps.value[0].$validator.toString()}`;
    return translate(err);
  }

  return null;
});

const focus = () => {
  if (inputRef.value) inputRef.value.focus();
};
const getInputRef = () => {
  if (inputRef.value) return inputRef.value;
};

const emit = defineEmits(["update:modelValue", "update:checkboxValue"]);
const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emit("update:modelValue", items);
  },
});
const modelCheckbox = computed({
  get: () => props.checkboxValue,
  set: (items) => {
    emit("update:checkboxValue", items);
  },
});
defineExpose({ focus, getInputRef });
</script>
<template>
  <div>
    <template
      v-if="
        [
          'text',
          'password',
          'email',
          'search',
          'date',
          'datetime',
          'url',
          'textarea',
          'select',
          'phone',
        ].includes(type)
      "
    >
      <label
        :for="id"
        v-if="label"
        class="fws-label"
        :class="{
          error: checkErrors,
        }"
      >
        {{ label }} <span v-if="req" class="text-red-700">*</span>
      </label>
      <input
        v-if="
          [
            'text',
            'password',
            'email',
            'search',
            'date',
            'datetime',
            'url',
          ].includes(type)
        "
        class="fws-input"
        :class="{
          error: checkErrors,
        }"
        ref="inputRef"
        :aria-describedby="label"
        :autocomplete="autocomplete"
        :id="id"
        v-model="model"
        :type="type"
        :disabled="disabled"
        :required="req"
        :placeholder="placeholder"
      />
      <textarea
        :aria-describedby="label"
        ref="inputRef"
        v-if="type == 'textarea'"
        class="fws-textarea"
        :class="{
          error: checkErrors,
        }"
        :autocomplete="autocomplete"
        :id="id"
        v-model="model"
        :disabled="disabled"
        :required="req"
        :placeholder="placeholder"
      ></textarea>
      <select
        :aria-describedby="label"
        :disabled="disabled"
        v-if="type == 'select'"
        :required="req"
        v-model="model"
        :id="id"
        ref="inputRef"
        :class="{
          error: checkErrors,
        }"
        class="fws-select"
      >
        <option v-for="opt in options" :value="opt[0]" :key="opt[0].toString()">
          {{ opt[1] }}
        </option>
      </select>
    </template>

    <template v-if="type == 'checkbox'">
      <div class="fws-checkbox">
        <input
          :aria-describedby="label"
          :id="id"
          ref="inputRef"
          :true-value="checkboxTrueValue"
          :false-value="checkboxFalseValue"
          v-model="modelCheckbox"
          type="checkbox"
          value=""
        />
        <label
          :for="id"
          v-if="label"
          :class="{
            error: checkErrors,
          }"
          >{{ label }}
          <a class="fws-link" :href="linkIcon" target="_blank" v-if="linkIcon">
            <LinkIcon class="w-4 h-4" />
          </a>
        </label>
      </div>
    </template>
    <p v-if="checkErrors" class="mt-2 text-xs fws-error-text">
      {{ checkErrors }}
    </p>

    <p
      class="fws-input-helper"
      v-if="help && !['checkbox', 'radio'].includes(type)"
    >
      {{ help }}
    </p>
  </div>
</template>
<style scoped>
.fws-label {
  @apply block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white;

  &.error {
    @apply text-red-700 dark:text-red-500;
  }
}
.fws-input-helper {
  @apply mt-2 text-sm text-fv-neutral-500 dark:text-fv-neutral-400;
}
.fws-input {
  @apply shadow-sm bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500 block w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500;
  &.error {
    @apply bg-red-50 border border-red-500 text-red-900 placeholder-red-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-red-100 dark:border-red-400;
  }
}
.fws-textarea {
  @apply block p-2.5 w-full text-sm text-fv-neutral-900 bg-fv-neutral-50 rounded-lg border border-fv-neutral-300 focus:ring-fv-primary-500 focus:border-fv-primary-500 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500;
  &.error {
    @apply bg-red-50 border border-red-500 text-red-900 placeholder-red-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-red-100 dark:border-red-400;
  }
}

.fws-select {
  @apply bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500 block w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500;
  &.error {
    @apply bg-red-50 border border-red-500 text-red-900 placeholder-red-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-red-100 dark:border-red-400;
  }
}
.fws-checkbox {
  @apply flex items-center mb-4;
}

.fws-checkbox input {
  @apply w-4 h-4 text-fv-primary-600 bg-fv-neutral-100 border-fv-neutral-300 rounded focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600 dark:ring-offset-fv-neutral-800 dark:focus:ring-offset-fv-neutral-800 focus:ring-2 dark:bg-fv-neutral-700 dark:border-fv-neutral-600;
  &.error {
    @apply bg-red-50 border border-red-500 text-red-900 placeholder-red-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-red-100 dark:border-red-400;
  }
}
.fws-checkbox label {
  @apply ml-2 text-sm font-medium text-fv-neutral-900 dark:text-fv-neutral-300;
}
</style>
