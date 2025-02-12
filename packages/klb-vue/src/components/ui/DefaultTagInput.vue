<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEventBus } from '../../composables/event-bus'

/**
 * Tag color variants
 */
 type colorType = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'neutral'

/**
 * Define component properties
 */
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
    /** Error string; if present, the border turns red and you can display a helper message */
    error?: string
    copyButton?: boolean
    /** If true, prevents the user from adding duplicate tags */
    noDuplicates?: boolean
    /** If > 0, sets the maximum number of tags allowed */
    maxTags?: number
  }>(),
  {
    copyButton: false,
    maxLenghtPerTag: 0,
    color: 'blue',
    label: 'Tags',
    separators: () => [','],
    autofocus: false,
    noDuplicates: false,
    maxTags: 0,
  },
)

/**
 * Refs & Data
 */
const textInput = ref<HTMLElement>()
const isMaxReached = ref(false)

const emit = defineEmits(['update:modelValue'])

/**
 * Create a two-way computed property for modelValue
 */
const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emit('update:modelValue', items)
  },
})

/**
 * Watch the model to see if maxTags is reached
 */
watch(
  () => model.value.length,
  (newLength) => {
    if (props.maxTags && props.maxTags > 0) {
      isMaxReached.value = newLength >= props.maxTags
    }
  },
  { immediate: true },
)

/**
 * Focus on the input if autofocus is enabled
 */
onMounted(() => {
  if (props.autofocus) {
    focusInput()
  }
})

/**
 * Event Bus example (if you'd like notifications)
 */
const eventBus = useEventBus()

/**
 * Copy the tags to clipboard
 */
async function copyText() {
  const text = model.value.join(', ')
  await navigator.clipboard.writeText(text)

  // Example event bus notification
  eventBus.emit('SendNotif', {
    title: 'Tags copied!',
    type: 'success',
    time: 2500,
  })
}

/**
 * On each character input, check if user typed a separator
 */
function handleInput(event: Event) {
  const inputEvent = event as InputEvent
  if (!inputEvent.data) return
  const separatorsRegex = new RegExp(props.separators.join('|'))
  if (separatorsRegex.test(inputEvent.data)) {
    addTag()
  }
}

/**
 * Add a tag by splitting on the separator
 */
function addTag() {
  if (!textInput.value || isMaxReached.value) return

  const separatorsRegex = new RegExp(props.separators.join('|'))
  const textContent = textInput.value.textContent?.trim()

  if (!textContent) return

  const newTags = textContent
    .split(separatorsRegex)
    .map((tag: string) => tag.trim())
    .filter((tag: string) => tag.length > 0)

  // Remove duplicates if noDuplicates is enabled
  const filteredTags = props.noDuplicates
    ? newTags.filter(tag => !model.value.includes(tag))
    : newTags

  // If maxTags is set, ensure adding tags doesn't exceed the limit
  if (props.maxTags && props.maxTags > 0) {
    const slotsAvailable = props.maxTags - model.value.length
    filteredTags.splice(slotsAvailable)
  }

  model.value.push(...filteredTags)
  textInput.value.textContent = ''
}

/**
 * Remove a tag by index
 */
function removeTag(index: number) {
  model.value.splice(index, 1)
  focusInput()
}

/**
 * Handle backspace/delete on an empty input
 */
function removeLastTag() {
  if (!textInput.value) return
  if (textInput.value.textContent === '') {
    // If input is empty, remove the last tag
    model.value.pop()
  }
  else {
    // Otherwise, remove the last character in the input
    if (textInput.value.textContent) {
      textInput.value.textContent = textInput.value.textContent.slice(0, -1)
    }
    placeCursorToEnd()
  }
}

/**
 * Place the cursor at the end of the contenteditable text
 */
function placeCursorToEnd() {
  if (!textInput.value) return
  const range = document.createRange()
  const sel = window.getSelection()
  range.selectNodeContents(textInput.value)
  range.collapse(false)
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 * Focus the contenteditable input
 */
function focusInput() {
  if (textInput.value) {
    textInput.value.focus()
    placeCursorToEnd()
  }
}

/**
 * Handle pasting text
 */
function handlePaste(e: ClipboardEvent) {
  if (!textInput.value || isMaxReached.value) return

  const clipboardData = e.clipboardData ?? (window as any).clipboardData
  if (!clipboardData) return

  const text = clipboardData.getData('text')
  const separatorsRegex = new RegExp(props.separators.join('|'), 'g')
  const pasteText = text.replace(separatorsRegex, ',')
  textInput.value.textContent += pasteText
  e.preventDefault()
  addTag()
}
</script>

<template>
  <div class="space-y-1 w-full">
    <!-- Optional label -->
    <label
      v-if="label"
      :for="`tags_${id}`"
      class="block text-sm font-medium dark:text-white"
    >
      {{ label }}
      <!-- optional help text -->
      <span v-if="help" class="ml-1 text-xs text-fv-neutral-500 dark:text-fv-neutral-300">{{ help }}</span>
    </label>

    <div
      class="tags-input" :class="[
        $props.error ? 'error' : '',
        isMaxReached ? 'pointer-events-none opacity-75' : '',
      ]"
      role="textbox"
      :aria-label="label || 'Tags input'"
      :aria-invalid="$props.error ? 'true' : 'false'"
      @click="focusInput"
      @keydown.delete.prevent="removeLastTag"
      @keydown.enter.prevent="addTag"
    >
      <!-- Render each tag -->
      <span
        v-for="(tag, index) in model"
        :key="`${tag}-${index}`"
        class="tag"
        :class="{
          red: maxLenghtPerTag > 0 && tag.length > maxLenghtPerTag,
          [color]: maxLenghtPerTag === 0 || tag.length <= maxLenghtPerTag,
        }"
      >
        {{ tag }}
        <button
          type="button"
          class="flex items-center"
          aria-label="Remove tag"
          @click.prevent="removeTag(index)"
        >
          <svg
            class="w-3 h-3"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
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

      <!-- Contenteditable input for typing/pasting tags -->
      <div
        :id="`tags_${id}`"
        ref="textInput"
        contenteditable="true"
        class="input"
        :placeholder="isMaxReached
          ? 'Max tags reached'
          : 'Type or paste and press Enter...'"
        @input="handleInput"
        @paste.prevent="handlePaste"
      />
    </div>

    <!-- Inline error display if needed -->
    <p v-if="$props.error" class="text-xs text-red-500 mt-1">
      {{ $props.error }}
    </p>

    <!-- Copy button / or any additional actions -->
    <div v-if="copyButton" class="flex justify-end mt-1">
      <button
        class="btn neutral small"
        type="button"
        @click.prevent="copyText"
      >
        Copy tags
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Container for all tags plus input */
.tags-input {
  @apply w-full flex flex-wrap gap-2 items-center shadow-sm bg-fv-neutral-50
    border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-sm
    focus-within:ring-fv-primary-500 focus-within:border-fv-primary-500
    p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600
    dark:placeholder-fv-neutral-400 dark:text-white
    dark:focus-within:ring-fv-primary-500 dark:focus-within:border-fv-primary-500;
  cursor: text;
}

/* Error border */
.tags-input.error {
  @apply border-red-500 dark:border-red-400 border !important;
}

/* Tag styling */
.tag {
  @apply inline-flex gap-1 items-center
    font-medium px-2.5 py-0.5 rounded text-black
    dark:text-white cursor-default;
}

/* Color variants */
.tag.blue {
  @apply bg-blue-400 dark:bg-blue-800;
}
.tag.red {
  @apply bg-red-400 dark:bg-red-800;
}
.tag.green {
  @apply bg-green-400 dark:bg-green-800;
}
.tag.purple {
  @apply bg-purple-400 dark:bg-purple-800;
}
.tag.orange {
  @apply bg-orange-400 dark:bg-orange-800;
}
.tag.neutral {
  @apply bg-fv-neutral-400 dark:bg-fv-neutral-900;
}

/* The editable input area for new tags */
.input {
  @apply flex-grow min-w-[100px] outline-none border-none break-words;
}
</style>
