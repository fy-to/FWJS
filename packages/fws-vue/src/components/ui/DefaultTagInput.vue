<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'

type colorType = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'neutral'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    color?: colorType
    label?: string
    id: string
    separators?: string[]
    autofocus?: boolean
    help?: string
    maxLenghtPerTag?: number
    error?: string
    copyButton?: boolean
  }>(),
  {
    copyButton: false,
    maxLenghtPerTag: 0,
    color: 'blue',
    label: 'Tags',
    separators: () => [','],
    autofocus: false,
  },
)

const textInput = ref<HTMLElement>()

const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emit('update:modelValue', items)
  },
})

onMounted(() => {
  if (props.autofocus) {
    focusInput()
  }
})
const eventBus = useEventBus()
async function copyText() {
  const text = model.value.join(', ')
  await navigator.clipboard.writeText(text)
  eventBus.emit('SendNotif', {
    title: 'Text copied!',
    type: 'success',
    time: 2500,
  })
}

function handleInput(event: any) {
  const separatorsRegex = new RegExp(props.separators.join('|'))
  if (separatorsRegex.test(event.data)) {
    addTag()
  }
}

function addTag() {
  if (!textInput.value) return

  const separatorsRegex = new RegExp(props.separators.join('|'))
  if (!textInput.value.textContent) return
  const newTags = textInput.value.textContent
    .split(separatorsRegex)
    .map((tag: string) => tag.trim())
    .filter((tag: string) => tag.length > 0)
  model.value.push(...newTags)
  textInput.value.textContent = ''
}

function removeTag(index: number) {
  model.value.splice(index, 1)
  focusInput()
}

function removeLastTag() {
  if (!textInput.value) return
  if (textInput.value.textContent === '') {
    model.value.pop()
  }
  else {
    if (!textInput.value.textContent) return
    textInput.value.textContent = textInput.value.textContent.slice(0, -1)

    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(textInput.value)
    range.collapse(false)
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
function focusInput() {
  if (!textInput.value) return

  textInput.value.focus()
}

function handlePaste(e: any) {
  if (!textInput.value) return
  // @ts-expect-error: Property 'clipboardData' does not exist on type 'ClipboardEvent'.
  const text = (e.clipboardData || window.clipboardData).getData('text')
  const separatorsRegex = new RegExp(props.separators.join('|'), 'g')
  const pasteText = text.replace(separatorsRegex, ',')
  textInput.value.textContent += pasteText
  e.preventDefault()
  addTag()
}
</script>

<template>
  <div>
    <div
      :class="`tags-input ${$props.error ? 'error' : ''}`"
      @click="focusInput"
      @keydown.delete.prevent="removeLastTag"
      @keydown.enter.prevent="addTag"
    >
      <span
        v-for="(tag, index) in model"
        :key="index"
        class="tag"
        :class="{
          red: maxLenghtPerTag > 0 && tag.length > maxLenghtPerTag,
          [color]: maxLenghtPerTag === 0 || tag.length <= maxLenghtPerTag,
        }"
      >
        {{ tag }}
        <button type="button" @click.prevent="removeTag(index)">
          <svg
            class="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>
      </span>
      <div
        :id="`tags_${id}`"
        ref="textInput"
        contenteditable
        class="input"
        placeholder="Add a tag..."
        @input="handleInput"
        @paste.prevent="handlePaste"
      />
    </div>
    <div v-if="copyButton" class="flex justify-end mt-1">
      <button class="btn neutral small" type="button" @click.prevent="copyText">
        Copy tags
      </button>
    </div>
  </div>
</template>

<style scoped>
.tags-input {
  cursor: text;
  @apply flex flex-wrap gap-2  items-center shadow-sm bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-sm focus:ring-fv-primary-500 focus:border-fv-primary-500 w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500;
  &.error {
    @apply border-red-500  dark:border-red-400 border !important;
  }
}
.tag-label {
  @apply block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white;
}
.tag {
  @apply inline-flex gap-1   font-medium  px-2.5 py-0.5 rounded text-black dark:text-white;
  &.blue {
    @apply bg-blue-400  dark:bg-blue-900;
  }
  &.red {
    @apply bg-red-400  dark:bg-red-900;
  }
  &.green {
    @apply bg-green-400  dark:bg-green-900;
  }
  &.purple {
    @apply bg-purple-400  dark:bg-purple-900;
  }
  &.orange {
    @apply bg-orange-400  dark:bg-orange-900;
  }
  &.neutral {
    @apply bg-fv-neutral-400  dark:bg-fv-neutral-900;
  }
}

.input {
  flex-grow: 1;
  min-width: 100px;
  outline: none;
  border: none;
}
</style>
