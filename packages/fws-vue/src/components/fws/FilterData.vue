<script setup lang="ts">
import type { FilterDataItems } from '../../types'
import { AdjustmentsHorizontalIcon, ArrowPathIcon, FunnelIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import useVuelidate from '@vuelidate/core'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useTranslation } from '../../composables/translations'
import DefaultDateSelection from '../ui/DefaultDateSelection.vue'
import DefaultInput from '../ui/DefaultInput.vue'

const emit = defineEmits(['update:modelValue'])
const hidden = ref<boolean>(false)
const state = reactive<any>({ formData: {} })
const rules: any = { formData: {} }
const types = reactive<any>({})
const translate = useTranslation()
const fDynamicOptions = ref<any[]>([])
const eventBus = useEventBus()

const props = withDefaults(
  defineProps<{
    data?: Array<Array<FilterDataItems>>
    css: string
    modelValue?: Record<string, unknown>
  }>(),
  {
    showHeaders: true,
    data: () => [],
  },
)
function removeUndefinedStrings(input: any, undefinedValues: any[] = ['undefined']) {
  const output: any = {}

  Object.keys(input).forEach((key) => {
    if (!undefinedValues.includes(input[key]) && input[key] !== undefined) {
      if (!input[key].$between) {
        output[key] = input[key]
      }
      else {
        input[key].$between[0]
          = input[key].$between[0] === '' || input[key].$between[0] == null
            ? undefined
            : input[key].$between[0]
        input[key].$between[1]
          = input[key].$between[1] === '' || input[key].$between[1] == null
            ? undefined
            : input[key].$between[1]
        if (
          input[key].$between[0] !== undefined
          || input[key].$between[1] !== undefined
        ) {
          output[key] = input[key]
        }
      }
    }
  })

  return output
}

function formatValues(obj: any) {
  props.data.forEach((group) => {
    group.forEach((f) => {
      if (f.formats && f.formats[f.type]) {
        obj[f.uid] = f.formats[f.type](obj[f.uid])
      }
      if (f.formatRestValue) {
        obj[f.uid] = f.formatRestValue(obj[f.uid])
      }
    })
  })
  return removeUndefinedStrings(obj, ['undefined', ''])
}

function updateForms() {
  state.formData = {}
  rules.formData = {}
  props.data.forEach((group) => {
    group.forEach((f) => {
      state.formData[f.uid]
        = typeof f.default == 'object' && f.default
          ? JSON.parse(JSON.stringify(f.default))
          : f.default

      types[f.uid] = f.type

      if (f.options && f.options.length) {
        f.options = f.options.map((status) => {
          const [statusKey, statusValue] = status
          const translatedValue = translate(statusValue)
          return [statusKey, translatedValue]
        })
      }
      rules.formData[f.uid] = {}
    })
  })
  emit('update:modelValue', formatValues({ ...state.formData }))
}
updateForms()
const v$ = useVuelidate(rules, state)

function updateFormData(data: any) {
  data.forEach((d: any) => {
    if (d.uid) {
      state.formData[d.uid] = d.value
    }
  })
  submitForm()
}
function submitForm() {
  const formData = formatValues({ ...state.formData })
  emit('update:modelValue', formData)
  eventBus.emit('forceUpdateFilters', true)
}
function resetForm() {
  updateForms()
}
onMounted(() => {
  eventBus.on('resetFilters', resetForm)
  eventBus.on('updateFilters', updateFormData)
})
onUnmounted(() => {
  eventBus.off('resetFilters', resetForm)
  eventBus.off('updateFilters', updateFormData)
})
</script>

<template>
  <div class="filter-data-wrapper mb-6">
    <form v-if="!hidden" class="filter-data-form bg-white dark:bg-fv-neutral-900 rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 p-4" @submit.prevent="() => submitForm()">
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-2" :class="[
          css,
          { 'lg:grid-cols-3': data.length >= 3, 'lg:grid-cols-4': data.length >= 4 },
        ]"
      >
        <div v-for="(g, i) in data" :key="`index_${i}`" class="relative">
          <template v-for="f in g" :key="f.uid">
            <template v-if="!f.isHidden">
              <DefaultInput
                v-if="
                  ['text', 'select', 'date', 'email', 'autocomplete'].includes(
                    f.type,
                  )
                "
                :id="f.uid"
                v-model="state.formData[f.uid]"
                :type="f.type === 'autocomplete' ? 'text' : f.type"
                :label="f.label"
                :options="f.options ? f.options : [[]]"
                :error-vuelidate="v$.formData[f.uid].$errors"
                class="mb-2"
                @focus="
                  () => {
                    f.focused = true;
                    $eventBus.emit('focusInput', true);
                  }
                "
                @blur="
                  () => {
                    f.focused = false;
                    $eventBus.emit('focusInput', false);
                  }
                "
                @change="
                  (ev: any) => {
                    if (f.onChangeValue) {
                      f.onChangeValue(state.formData, ev);
                    }
                  }
                "
                @update:model-value="
                  (v:any) => {
                    if (f.autocomplete && v.length >= 2) {
                      fDynamicOptions = [];
                      f.autocomplete(v).then((r:any) => {
                        fDynamicOptions = r;
                      });
                    }
                  }
                "
              >
                <div
                  v-if="f.type === 'autocomplete' && f.focused && fDynamicOptions.length > 0"
                  class="absolute flex flex-col gap-2 p-2 bottom-0 translate-y-full inset-x-0 bg-white dark:bg-fv-neutral-800 border border-fv-neutral-200 dark:border-fv-neutral-700 z-10 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <button
                    v-for="o in fDynamicOptions"
                    :key="o[0]"
                    class="flex items-center justify-between p-2 text-fv-neutral-800 dark:text-fv-neutral-200 hover:bg-fv-neutral-100 dark:hover:bg-fv-neutral-700 rounded transition-colors duration-200"
                    type="button"
                    @click.prevent="
                      () => {
                        f.focused = false;
                        state.formData[f.uid] = o[0];
                      }
                    "
                  >
                    <span class="font-medium">{{ o[1] }}</span>
                    <small v-if="o[0] !== ''" class="text-fv-neutral-500 dark:text-fv-neutral-400 ml-2">({{ o[0] }})</small>
                  </button>
                </div>
              </DefaultInput>

              <DefaultDateSelection
                v-if="f.type === 'range'"
                :id="f.uid"
                v-model="state.formData[f.uid]"
                :label="f.label"
                mode="interval"
              />
            </template>
          </template>
        </div>
      </div>

      <div class="flex flex-wrap justify-between items-center mt-6 gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            class="btn-filter flex items-center justify-center gap-2 px-4 py-2 bg-fv-primary-600 hover:bg-fv-primary-700 text-white font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-fv-primary-500 focus:ring-offset-2 dark:focus:ring-offset-fv-neutral-900"
          >
            <AdjustmentsHorizontalIcon class="w-4 h-4" aria-hidden="true" />
            {{ $t("filters_search_cta") }}
          </button>

          <button
            type="reset"
            class="btn-reset flex items-center justify-center gap-2 px-4 py-2 bg-fv-neutral-100 hover:bg-fv-neutral-200 text-fv-neutral-800 font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-fv-neutral-400 focus:ring-offset-2 dark:bg-fv-neutral-800 dark:hover:bg-fv-neutral-700 dark:text-fv-neutral-200 dark:focus:ring-offset-fv-neutral-900"
            @click.prevent="() => { resetForm(); }"
          >
            <ArrowPathIcon class="w-4 h-4" aria-hidden="true" />
            {{ $t("filters_clear_cta") }}
          </button>
        </div>

        <button
          type="button"
          class="btn-hide flex items-center justify-center gap-2 px-4 py-2 border border-fv-neutral-300 dark:border-fv-neutral-700 bg-white hover:bg-fv-neutral-50 text-fv-neutral-700 font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-fv-neutral-400 focus:ring-offset-2 dark:bg-fv-neutral-900 dark:hover:bg-fv-neutral-800 dark:text-fv-neutral-300 dark:focus:ring-offset-fv-neutral-900"
          @click="hidden = true"
        >
          <XMarkIcon class="w-4 h-4" aria-hidden="true" />
          {{ $t("hide_filters_cta") }}
        </button>
      </div>
    </form>

    <div v-else class="text-center">
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-fv-primary-100 hover:bg-fv-primary-200 text-fv-primary-800 font-medium rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-fv-primary-500 focus:ring-offset-2 dark:bg-fv-primary-900 dark:hover:bg-fv-primary-800 dark:text-fv-primary-200 dark:focus:ring-offset-fv-neutral-900"
        @click="hidden = false"
      >
        <FunnelIcon class="w-4 h-4" aria-hidden="true" />
        {{ $t("show_filters_cta") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-data-wrapper {
  @apply transition-shadow duration-300;
}

.filter-data-form {
  @apply animate-fadeIn;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

/* Responsive styles */
@media (max-width: 640px) {
  .filter-data-form {
    @apply p-3;
  }
}

/* Button hover effects */
.btn-filter, .btn-reset, .btn-hide {
  @apply relative overflow-hidden;
}

.btn-filter::after,
.btn-reset::after,
.btn-hide::after {
  content: '';
  @apply absolute inset-0 opacity-0 transition-opacity duration-200;
}

.btn-filter:hover::after {
  @apply opacity-10 bg-white;
}

.btn-reset:hover::after,
.btn-hide:hover::after {
  @apply opacity-10 bg-black;
}

/* Improved focus styles for accessibility */
button:focus-visible {
  @apply outline-none ring-2 ring-fv-primary-500 ring-offset-2 dark:ring-offset-fv-neutral-900;
}
</style>
