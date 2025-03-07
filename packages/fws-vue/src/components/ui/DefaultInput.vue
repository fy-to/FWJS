<script setup lang="ts">
import type { ErrorObject } from '@vuelidate/core'
import { computed, ref, toRef } from 'vue'
import { useTranslation } from '../../composables/translations'
import DefaultTagInput from './DefaultTagInput.vue'

type modelValueType = string | number | string[] | number[] | undefined
type checkboxValueType = any[] | Set<any> | undefined | boolean

const props = withDefaults(
  defineProps<{
    id: string
    showLabel?: boolean
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    mask?: string
    checkboxTrueValue?: string | boolean
    checkboxFalseValue?: string | boolean
    req?: boolean
    linkIcon?: string
    modelValue?: modelValueType
    checkboxValue?: checkboxValueType
    options?: string[][]
    dpOptions?: Record<string, any>
    help?: string
    error?: string
    color?: string
    errorVuelidate?: ErrorObject[]
    disabled?: boolean
    maxLengthPerTag?: number
    disableDatesUnder18?: boolean
    copyButton?: boolean
    maxRange?: number
    minRange?: number
  }>(),
  {
    showLabel: true,
    type: 'text',
    req: false,
    options: () => [],
    checkboxTrueValue: true,
    checkboxFalseValue: false,
    disabled: false,
    maxLengthPerTag: 0,
    maxRange: 100,
    minRange: 0,
    disableDatesUnder18: false,
    copyButton: false,
    dpOptions: () => ({}),
  },
)

const translate = useTranslation()
const inputRef = ref<HTMLInputElement>()

const errorProps = toRef(props, 'error')
const errorVuelidateProps = toRef(props, 'errorVuelidate')

const checkErrors = computed(() => {
  if (errorProps.value) return errorProps.value
  if (errorVuelidateProps.value && errorVuelidateProps.value.length > 0) {
    const errKey = `vuelidate_validator_${errorVuelidateProps.value[0].$validator.toString()}`
    return translate(errKey)
  }
  return null
})

function focus() {
  if (inputRef.value) inputRef.value.focus()
}
function blur() {
  if (inputRef.value) inputRef.value.blur()
}
function getInputRef() {
  return inputRef.value
}

const emit = defineEmits([
  'update:modelValue',
  'update:checkboxValue',
  'focus',
  'blur',
])

function handleFocus() {
  emit('focus', props.id)
}
function handleBlur() {
  emit('blur', props.id)
}

const model = computed<modelValueType>({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

const modelCheckbox = computed<checkboxValueType>({
  get: () => props.checkboxValue,
  set: (value) => {
    emit('update:checkboxValue', value)
  },
})

defineExpose({ focus, blur, getInputRef })
</script>

<template>
  <div>
    <!-- TEXT, PASSWORD, EMAIL, SEARCH, DATE, DATETIME, URL, TEXTAREA, SELECT, PHONE, TEL, RANGE, CHIPS, TAGS, MASK, DATEPICKER -->
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
          'tel',
          'range',
          'chips',
          'tags',
          'mask',
          'datepicker',
        ].includes(type)
      "
    >
      <div class="flex flex-col gap-2">
        <!-- Basic input types -->
        <div
          v-if="
            [
              'text',
              'phone',
              'tel',
              'password',
              'range',
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
            v-if="showLabel && label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
          >
            {{ label }}
            <template v-if="type === 'range'">
              ({{ model }})
            </template>
          </label>

          <input
            :id="id"
            ref="inputRef"
            v-model="model"
            :type="type === 'datepicker' ? 'date' : type === 'phone' ? 'tel' : type"
            :name="id"
            :class="{
              'error': checkErrors,
              'bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500 block w-full p-2.5  dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400  dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500': type !== 'range',
              'w-full h-2 bg-fv-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-fv-neutral-700': type === 'range',
            }"
            :autocomplete="autocomplete"
            :min="type === 'range' ? minRange : undefined"
            :max="type === 'range' ? maxRange : undefined"
            :placeholder="placeholder"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : undefined"
            :required="req"
            :aria-invalid="checkErrors ? 'true' : 'false'"
            @focus="handleFocus"
            @blur="handleBlur"
          >

          <!-- Range Input Extra Labels -->
          <template v-if="type === 'range'">
            <span
              class="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6"
            >
              Min ({{ minRange }})
            </span>
            <span
              class="text-sm text-gray-500 dark:text-gray-400 absolute start-1/3 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6"
            >
              {{ ((maxRange - minRange) / 3 + minRange).toFixed(0) }}
            </span>
            <span
              class="text-sm text-gray-500 dark:text-gray-400 absolute start-2/3 -translate-x-1/2 rtl:translate-x-1/2 -bottom-6"
            >
              {{ (((maxRange - minRange) / 3) * 2 + minRange).toFixed(0) }}
            </span>
            <span
              class="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6"
            >
              Max ({{ maxRange }})
            </span>
          </template>
        </div>

        <!-- CHIPS / TAGS -->
        <div v-if="type === 'chips' || type === 'tags'">
          <label
            v-if="showLabel && (label || placeholder)"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
          >
            {{ label ? label : placeholder }}
          </label>
          <!-- @vue-skip -->
          <DefaultTagInput
            :id="id"
            v-model="model"
            :disabled="disabled"
            :color="color"
            :error="checkErrors"
            :copy-button="copyButton"
            :help="help"
            :max-lenght-per-tag="maxLengthPerTag"
          />
        </div>

        <!-- TEXTAREA (AUTO-GROW) -->
        <div v-else-if="type === 'textarea-grow'" class="group relative">
          <label
            v-if="showLabel && label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
          >
            {{ label }}
          </label>
          <div class="grow-wrap">
            <!-- @vue-skip -->
            <textarea
              :id="id"
              ref="inputRef"
              v-model="model"
              :name="id"
              :class="{
                error: checkErrors,
              }"
              :placeholder="placeholder"
              :disabled="disabled"
              :aria-describedby="help ? `${id}-help` : undefined"
              :required="req"
              :aria-invalid="checkErrors ? 'true' : 'false'"
              class="block p-2.5 w-full text-sm text-fv-neutral-900 bg-fv-neutral-50 rounded-lg
                     border border-fv-neutral-300 focus:ring-fv-primary-500 focus:border-fv-primary-500
                     dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400
                     dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500"
              @focus="handleFocus"
              @blur="handleBlur"
            />
          </div>
          <div
            v-if="dpOptions.counterMax && model"
            class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
            :class="{
              'text-red-500 dark:text-red-300':
                model?.toString().length > dpOptions.counterMax,
            }"
          >
            {{ model?.toString().length }} / {{ dpOptions.counterMax }} characters
          </div>
        </div>

        <!-- TEXTAREA (REGULAR) -->
        <div v-else-if="type === 'textarea'" class="group relative">
          <label
            v-if="showLabel && label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
          >
            {{ label }}
          </label>
          <!-- @vue-skip -->
          <textarea
            :id="id"
            ref="inputRef"
            v-model="model"
            :name="id"
            :class="{
              error: checkErrors,
            }"
            :placeholder="placeholder"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : undefined"
            :required="req"
            :aria-invalid="checkErrors ? 'true' : 'false'"
            class="block p-2.5 w-full text-sm text-fv-neutral-900 bg-fv-neutral-50
                   rounded-lg border border-fv-neutral-300 focus:ring-fv-primary-500
                   focus:border-fv-primary-500 dark:bg-fv-neutral-700 dark:border-fv-neutral-600
                   dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500
                   dark:focus:border-fv-primary-500"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          <div
            v-if="dpOptions.counterMax && model"
            class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
            :class="{
              'text-red-500 dark:text-red-300':
                model?.toString().length > dpOptions.counterMax,
            }"
          >
            {{ model?.toString().length }} / {{ dpOptions.counterMax }} characters
          </div>
        </div>

        <!-- SELECT -->
        <div v-else-if="type === 'select'" class="relative">
          <label
            v-if="showLabel && label"
            :for="id"
            class="block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white"
          >
            {{ label }}
          </label>
          <select
            :id="id"
            ref="inputRef"
            v-model="model"
            :name="id"
            :disabled="disabled"
            :aria-describedby="help ? `${id}-help` : undefined"
            :required="req"
            :class="{
              error: checkErrors,
            }"
            :aria-invalid="checkErrors ? 'true' : 'false'"
            class="bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm
                   rounded-lg focus:ring-fv-primary-500 focus:border-fv-primary-500
                   block w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600
                   dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500
                   dark:focus:border-fv-primary-500"
            @focus="handleFocus"
            @blur="handleBlur"
          >
            <option
              v-for="opt in options"
              :key="opt[0]?.toString()"
              :value="opt[0]"
            >
              {{ opt[1] }}
            </option>
          </select>
        </div>
      </div>
    </template>

    <!-- TOGGLE (switch) -->
    <template v-else-if="type === 'toggle'">
      <label
        class="inline-flex items-center mb-5 cursor-pointer"
        :class="{
          error: checkErrors,
        }"
      >
        <input
          v-model="modelCheckbox"
          type="checkbox"
          :true-value="checkboxTrueValue"
          :false-value="checkboxFalseValue"
          :disabled="disabled"
          class="sr-only peer"
          :aria-invalid="checkErrors ? 'true' : 'false'"
          :aria-describedby="help ? `${id}-help` : undefined"
          :aria-checked="modelCheckbox ? 'true' : 'false'"
          role="switch"
          @focus="handleFocus"
          @blur="handleBlur"
        >
        <div
          class="relative flex-0 flex-shrink-0 w-11 h-6 bg-fv-neutral-200 peer-focus:outline-none
                 peer-focus:ring-4 peer-focus:ring-fv-primary-300 dark:peer-focus:ring-fv-primary-800
                 rounded-full peer dark:bg-fv-neutral-700 peer-checked:after:translate-x-full
                 rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white
                 after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                 after:bg-white after:border-fv-neutral-300 after:border after:rounded-full
                 after:w-5 after:h-5 after:transition-all dark:border-fv-neutral-600
                 peer-checked:bg-fv-primary-600"
        />
        <span
          class="ms-3 text-sm font-medium text-fv-neutral-900 dark:text-fv-neutral-300"
        >
          {{ label }}
          <template v-if="help">
            <p
              :id="help ? `${id}-help` : undefined"
              class="text-fv-neutral-600 dark:text-fv-neutral-400 !text-sm"
            >
              {{ help }}
            </p>
          </template>
        </span>
      </label>
    </template>

    <!-- CHECKBOX / RADIO -->
    <template v-else-if="type === 'checkbox' || type === 'radio'">
      <div class="flex mb-4">
        <div class="flex items-center h-5">
          <input
            :id="id"
            ref="inputRef"
            v-model="modelCheckbox"
            :class="{
              error: checkErrors,
            }"
            :aria-describedby="help ? `${id}-help` : undefined"
            :type="type"
            :true-value="checkboxTrueValue"
            :false-value="checkboxFalseValue"
            :disabled="disabled"
            :aria-invalid="checkErrors ? 'true' : 'false'"
            class="w-4 h-4 text-fv-primary-600 bg-fv-neutral-100 border-fv-neutral-300
                   rounded focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600
                   dark:ring-offset-fv-neutral-800 dark:focus:ring-offset-fv-neutral-800
                   focus:ring-2 dark:bg-fv-neutral-700 dark:border-fv-neutral-600"
            @focus="handleFocus"
            @blur="handleBlur"
          >
        </div>
        <div class="ms-2 text-sm">
          <label
            :for="id"
            class="font-medium text-fv-neutral-900 dark:text-fv-neutral-300"
          >
            {{ label }}
          </label>
          <p
            v-if="help"
            :id="`${id}-help`"
            class="text-xs font-normal text-fv-neutral-500 dark:text-fv-neutral-400"
          >
            {{ help }}
          </p>
        </div>
      </div>
    </template>

    <!-- Error message -->
    <p
      v-if="checkErrors"
      class="mt-0.5 text-sm text-red-600 dark:text-red-300"
      role="alert"
      aria-live="assertive"
    >
      {{ checkErrors }}
    </p>

    <!-- Help text (for other input types) -->
    <p
      v-if="help && !['checkbox', 'radio', 'toggle'].includes(type)"
      :id="`${id}-help`"
      class="mt-1 text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
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
    @apply border-red-500 dark:border-red-400;
  }
}
</style>
