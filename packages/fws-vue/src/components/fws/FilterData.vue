<script setup lang="ts">
import type { FilterDataItems } from '../../types'
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
  <form v-if="!hidden" @submit.prevent="() => submitForm()">
    <div :class="css">
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
                v-if="f.type === 'autocomplete' && f.focused"
                class="absolute flex flex-col gap-2 p-2 bottom-0 translate-y-full inset-x-0 bg-fv-neutral-200 dark:bg-fv-neutral-800 border border-fv-neutral-700 z-10"
              >
                <button
                  v-for="o in fDynamicOptions"
                  :key="o[0]"
                  class="flex items-center justify-between btn defaults neutral"
                  type="button"
                  @click.prevent="
                    () => {
                      f.focused = false;
                      state.formData[f.uid] = o[0];
                    }
                  "
                >
                  {{ o[1] }} <small v-if="o[0] !== ''">({{ o[0] }})</small>
                </button>
              </div>
            </DefaultInput>

            <DefaultDateSelection
              v-if="f.type === 'range'"
              :id="f.uid"
              v-model="state.formData[f.uid]"
              :label="f.label"
              mode="interval"
              class="mb-2"
            />
          </template>
        </template>
      </div>
    </div>

    <div class="flex justify-between mt-2 gap-x-2">
      <button type="submit" class="btn defaults primary">
        {{ $t("filters_search_cta") }}
      </button>
      <button type="button" class="btn defaults primary" @click="hidden = true">
        {{ $t("hide_filters_cta") }}
      </button>
      <button
        type="reset"
        class="btn defaults neutral"
        @click.prevent="
          () => {
            resetForm();
          }
        "
      >
        {{ $t("filters_clear_cta") }}
      </button>
    </div>
  </form>
  <div v-else class="flex justify-between mt-2 gap-x-2">
    <button
      type="button"
      class="btn defaults primary !w-full flex-1 !text-center !items-center"
      @click="hidden = false"
    >
      {{ $t("show_filters_cta") }}
    </button>
  </div>
</template>
