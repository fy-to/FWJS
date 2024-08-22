<script setup lang="ts">
import { LinkIcon } from "@heroicons/vue/24/solid";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  toRef,
} from "vue";
import type { ErrorObject } from "@vuelidate/core";
import { useTranslation } from "../../composables/translations";
import DefaultTagInput from "./DefaultTagInput.vue";
//import VueTailwindDatepicker from "vue-tailwind-datepicker";

type modelValueType = string | number | string[] | number[] | undefined;

type checkboxValueType = any[] | Set<any> | undefined | boolean;
const props = withDefaults(
  defineProps<{
    id: string;
    showLabel?: boolean;
    label?: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    mask?: string;
    checkboxTrueValue?: string | boolean;
    checkboxFalseValue?: string | boolean;
    req?: boolean;
    linkIcon?: string;
    modelValue?: modelValueType;
    checkboxValue?: checkboxValueType;
    options?: string[][];
    dpOptions?: Record<string, any>;
    help?: string;
    error?: string;
    color?: string;
    errorVuelidate?: ErrorObject[];
    disabled?: boolean;
    maxLengthPerTag?: number;
    disableDatesUnder18?: boolean;
    copyButton?: boolean;
  }>(),
  {
    showLabel: true,
    type: "text",
    req: false,
    options: () => [],
    checkboxTrueValue: true,
    checkboxFalseValue: false,
    disabled: false,
    maxLengthPerTag: 0,
    disableDatesUnder18: false,
    copyButton: false,
    dpOptions: () => ({}),
  },
);
const disableDatesAdult = (date: Date) => {
  if (!props.disableDatesUnder18) return false;
  const today = new Date();
  const date18YearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  return date >= date18YearsAgo;
};

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
const blur = () => {
  if (inputRef.value) inputRef.value.blur();
};
const getInputRef = () => {
  if (inputRef.value) return inputRef.value;
};

const handleFocus = () => {
  emit("focus", props.id);
};

const handleBlur = () => {
  emit("blur", props.id);
};

const emit = defineEmits([
  "update:modelValue",
  "update:checkboxValue",
  "focus",
  "blur",
]);
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
defineExpose({ focus, blur, getInputRef });
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
          'textarea-grow',
          'select',
          'phone',
          'chips',
          'tags',
          'mask',
          'datepicker',
        ].includes(type)
      "
    >
      <div class="flex flex-col gap-2">
        <div
          v-if="
            [
              'text',
              'phone',
              'password',
              'email',
              'search',
              'url',
              'mask',
              'date',
              'datetime',
              'datepicker',
            ].includes(type)
          "
          class="relative"
        >
          <label
            :for="id"
            v-if="label"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label }}
          </label>
          <input
            ref="inputRef"
            :type="type === 'datepicker' ? 'date' : type"
            :id="id"
            :name="id"
            :class="{
              error: checkErrors,
            }"
            v-model="model"
            :autocomplete="autocomplete"
            :placeholder="placeholder"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : id"
            class="bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500 block w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500"
            :required="req"
            @focus="handleFocus"
            @blur="handleBlur"
          />
        </div>
        <!--
        <div v-if="type == 'datepicker'">
          <label
            :for="id"
            v-if="label || placeholder"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label ? label : placeholder }}
          </label>
          <div class="relative">
            <VueTailwindDatepicker
              v-model="model"
              :disable-date="disableDatesAdult"
              :formatter="{
                date: 'YYYY-MM-DD',
                month: 'MMM',
              }"
              :placeholder="placeholder"
              as-single
            ></VueTailwindDatepicker>
          </div>
        </div>
        -->

        <div v-if="type == 'chips' || type == 'tags'">
          <label
            :for="id"
            v-if="label || placeholder"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label ? label : placeholder }}
          </label>
          <!-- @vue-skip -->
          <DefaultTagInput
            v-model="model"
            :id="id"
            :disabled="disabled"
            :color="color"
            :error="checkErrors"
            :copyButton="copyButton"
            :help="help"
            :max-lenght-per-tag="maxLengthPerTag"
          />
        </div>
        <div class="group relative" v-else-if="type == 'textarea-grow'">
          <label
            v-if="label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label }}</label
          >
          <div class="grow-wrap">
            <!-- @vue-skip -->
            <textarea
              :id="id"
              :name="id"
              ref="inputRef"
              :class="{
                error: checkErrors,
              }"
              v-model="model"
              :placeholder="placeholder"
              :disabled="disabled"
              :aria-describedby="help ? `${id}-help` : id"
              :required="req"
              @focus="handleFocus"
              @blur="handleBlur"
              class="block p-2.5 w-full text-sm text-fv-neutral-900 bg-fv-neutral-50 rounded-lg border border-fv-neutral-300 focus:ring-fv-primary-500 focus:border-fv-primary-500 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500"
            ></textarea>
          </div>
          <div
            v-if="dpOptions.counterMax && model"
            class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
            :class="{
              'text-red-500 dark:text-red-300':
                model?.toString().length > dpOptions.counterMax,
            }"
          >
            {{ model?.toString().length }} /
            {{ dpOptions.counterMax }} characters
          </div>
        </div>
        <div class="group relative" v-else-if="type == 'textarea'">
          <label
            v-if="label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label }}</label
          >
          <!-- @vue-skip -->
          <textarea
            :id="id"
            :name="id"
            ref="inputRef"
            :class="{
              error: checkErrors,
            }"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : id"
            :required="req"
            @focus="handleFocus"
            @blur="handleBlur"
            class="block p-2.5 w-full text-sm text-fv-neutral-900 bg-fv-neutral-50 rounded-lg border border-fv-neutral-300 focus:ring-fv-primary-500 focus:border-fv-primary-500 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500"
          ></textarea>
          <div
            v-if="dpOptions.counterMax && model"
            class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
            :class="{
              'text-red-500 dark:text-red-300':
                model?.toString().length > dpOptions.counterMax,
            }"
          >
            {{ model?.toString().length }} /
            {{ dpOptions.counterMax }} characters
          </div>
        </div>
        <div class="relative" v-else-if="type == 'select'">
          <label
            :for="id"
            v-if="label"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
            >{{ label }}</label
          >
          <select
            :id="id"
            :name="id"
            ref="inputRef"
            v-model="model"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : id"
            :required="req"
            @focus="handleFocus"
            @blur="handleBlur"
            :class="{
              error: checkErrors,
            }"
            class="bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500 block w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500"
          >
            <option
              v-for="opt in options"
              :value="opt[0]"
              :key="opt[0].toString()"
            >
              {{ opt[1] }}
            </option>
          </select>
        </div>
      </div>
    </template>
    <template v-else-if="type === 'toggle'">
      <label
        class="inline-flex items-center mb-5 cursor-pointer"
        :class="{
          error: checkErrors,
        }"
      >
        <input
          type="checkbox"
          v-model="modelCheckbox"
          :true-value="checkboxTrueValue"
          :false-value="checkboxFalseValue"
          :disabled="disabled"
          class="sr-only peer"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <div
          class="relative flex-0 flex-shrink-0 w-11 h-6 bg-fv-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fv-primary-300 dark:peer-focus:ring-fv-primary-800 rounded-full peer dark:bg-fv-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-fv-neutral-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all dark:border-fv-neutral-600 peer-checked:bg-fv-primary-600"
        ></div>
        <span
          class="ms-3 text-sm font-medium text-fv-neutral-900 dark:text-fv-neutral-300"
        >
          {{ label }}
          <template v-if="help">
            <p class="text-fv-neutral-600 dark:text-fv-neutral-400 !text-sm">
              {{ help }}
            </p>
          </template>
        </span>
      </label>
    </template>
    <template v-else-if="type == 'checkbox' || type == 'radio'">
      <div class="flex mb-4">
        <div class="flex items-center h-5">
          <input
            :id="id"
            :class="{
              error: checkErrors,
            }"
            :aria-describedby="help ? `${id}-help` : id"
            :type="type"
            @focus="handleFocus"
            @blur="handleBlur"
            :true-value="checkboxTrueValue"
            :false-value="checkboxFalseValue"
            v-model="modelCheckbox"
            :disabled="disabled"
            class="w-4 h-4 text-fv-primary-600 bg-fv-neutral-100 border-fv-neutral-300 rounded focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600 dark:ring-offset-fv-neutral-800 dark:focus:ring-offset-fv-neutral-800 focus:ring-2 dark:bg-fv-neutral-700 dark:border-fv-neutral-600"
          />
        </div>
        <div class="ms-2 text-sm">
          <label
            :for="id"
            class="font-medium text-fv-neutral-900 dark:text-fv-neutral-300"
            >{{ label }}</label
          >
          <p
            :id="`${id}-help`"
            v-if="help"
            class="text-xs font-normal text-fv-neutral-500 dark:text-fv-neutral-400"
          >
            {{ help }}
          </p>
        </div>
      </div>
    </template>
    <p v-if="checkErrors" class="mt-0.5 text-sm text-red-600 dark:text-red-300">
      {{ checkErrors }}
    </p>

    <p
      :id="`${id}-help`"
      class="mt-1 text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
      v-if="help && !['checkbox', 'radio', 'toggle'].includes(type)"
    >
      {{ help }}
    </p>
  </div>
</template>
<style scoped>
input,
textarea,
select {
  &.error {
    @apply border-red-500  dark:border-red-400;
  }
}
</style>
