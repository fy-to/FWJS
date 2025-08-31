<script setup lang="ts">
import { useDebounceFn, useVModel } from '@vueuse/core'
import { computed, onMounted, shallowRef, watch } from 'vue'
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
 * Refs & Data - using shallowRef for DOM elements for better performance
 */
const textInput = shallowRef<HTMLElement>()
const isMaxReached = shallowRef(false)
const inputContainer = shallowRef<HTMLElement>()

const emit = defineEmits(['update:modelValue'])

/**
 * Use VueUse's useVModel for more efficient two-way binding
 */
const model = useVModel(props, 'modelValue', emit)

/**
 * Cache regex patterns to avoid creating them on each input
 */
const getSeparatorRegex = (() => {
  let cachedRegex: RegExp | null = null
  let cachedGlobalRegex: RegExp | null = null

  return (isGlobal = false) => {
    if (isGlobal) {
      if (!cachedGlobalRegex) {
        cachedGlobalRegex = new RegExp(props.separators.join('|'), 'g')
      }
      return cachedGlobalRegex
    }
    else {
      if (!cachedRegex) {
        cachedRegex = new RegExp(props.separators.join('|'))
      }
      return cachedRegex
    }
  }
})()

/**
 * Compute aria-describedby IDs if help or error exist
 */
const describedByIds = computed(() => {
  const ids: string[] = []
  if (props.help) {
    ids.push(`help_tags_${props.id}`)
  }
  if (props.error) {
    ids.push(`error_tags_${props.id}`)
  }
  return ids.join(' ')
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
 * Event Bus for notifications
 */
const eventBus = useEventBus()

/**
 * Copy the tags to clipboard with debounce to prevent multiple executions
 */
const copyText = useDebounceFn(async () => {
  if (!model.value.length) return

  const text = model.value.join(', ')

  try {
    await navigator.clipboard.writeText(text)

    eventBus.emit('SendNotif', {
      title: 'Tags copied!',
      type: 'success',
      time: 2500,
    })
  }
  catch {
    eventBus.emit('SendNotif', {
      title: 'Failed to copy tags',
      type: 'error',
      time: 2500,
    })
  }
}, 300)

/**
 * On each character input, check if user typed a separator
 */
const handleInput = useDebounceFn((event: Event) => {
  const inputEvent = event as InputEvent
  if (!inputEvent.data) return

  if (getSeparatorRegex().test(inputEvent.data)) {
    addTag()
  }
}, 50)

/**
 * Add a tag by splitting on the separator - optimized with fewer operations
 */
function addTag() {
  if (!textInput.value || isMaxReached.value) return

  const textContent = textInput.value.textContent?.trim()
  if (!textContent) return

  const newTags = textContent
    .split(getSeparatorRegex())
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  // Remove duplicates if noDuplicates is enabled
  const filteredTags = props.noDuplicates
    ? newTags.filter(tag => !model.value.includes(tag))
    : newTags

  // If maxTags is set, ensure adding tags doesn't exceed the limit
  if (props.maxTags && props.maxTags > 0) {
    const slotsAvailable = props.maxTags - model.value.length
    if (slotsAvailable <= 0) {
      // If no slots are available, clear input and return
      textInput.value.textContent = ''
      return
    }
    if (filteredTags.length > slotsAvailable) {
      filteredTags.splice(slotsAvailable)
    }
  }

  if (filteredTags.length) {
    model.value = [...model.value, ...filteredTags]
  }

  textInput.value.textContent = ''
}

/**
 * Remove a tag by index
 */
const removeTag = useDebounceFn((index: number) => {
  if (index < 0 || index >= model.value.length) return

  const newTags = [...model.value]
  newTags.splice(index, 1)
  model.value = newTags
  focusInput()
}, 50)

/**
 * Handle backspace/delete on an empty input
 */
function removeLastTag() {
  if (!textInput.value) return

  if (textInput.value.textContent === '') {
    // If input is empty, remove the last tag
    if (model.value.length > 0) {
      const newTags = [...model.value]
      newTags.pop()
      model.value = newTags
    }
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
 * Using requestAnimationFrame for better performance
 */
function placeCursorToEnd() {
  if (!textInput.value) return

  requestAnimationFrame(() => {
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(textInput.value!)
    range.collapse(false)
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(range)
  })
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
 * Handle pasting text - without debounce for direct response
 */
function handlePaste(e: ClipboardEvent) {
  if (!textInput.value || isMaxReached.value) return

  // Prevent the default paste behavior
  e.preventDefault()

  // Get clipboard data
  const clipboardData = e.clipboardData
  if (!clipboardData) return

  // Get the pasted text
  const text = clipboardData.getData('text')
  if (!text || !text.trim()) return

  // Process the text (replace separator characters)
  const pasteText = text.replace(/,/g, ',')

  // Simply set the content - the most reliable approach
  textInput.value.textContent = pasteText

  // Add tags immediately
  addTag()
}

/**
 * Handle keyboard navigation between tags - optimized with element lookup caching
 */
function handleKeyNavigation(e: KeyboardEvent, index: number) {
  if (!inputContainer.value) return

  if (e.key === 'ArrowLeft' && index > 0) {
    const prevTag = inputContainer.value.querySelector(`[data-index="${index - 1}"] button`) as HTMLElement
    if (prevTag) prevTag.focus()
  }
  else if (e.key === 'ArrowRight' && index < model.value.length - 1) {
    const nextTag = inputContainer.value.querySelector(`[data-index="${index + 1}"] button`) as HTMLElement
    if (nextTag) nextTag.focus()
  }
}
</script>

<template>
  <div class="space-y-2 w-full">
    <div
      ref="inputContainer"
      class="tags-input"
      :class="[
        $props.error ? 'error' : '',
        isMaxReached ? 'max-reached' : '',
      ]"
      role="textbox"
      :aria-labelledby="`label_tags_${id}`"
      :aria-describedby="describedByIds || undefined"
      :aria-invalid="$props.error ? 'true' : 'false'"
      @click="focusInput"
      @keydown.delete.prevent="removeLastTag"
      @keydown.enter.prevent="addTag"
    >
      <!-- Render each tag -->
      <span
        v-for="(tag, index) in model"
        :key="`${tag}-${index}`"
        role="listitem"
        :data-index="index"
        class="tag"
        :class="{
          'tag-error': maxLenghtPerTag > 0 && tag.length > maxLenghtPerTag,
          [`tag-${color}`]: maxLenghtPerTag === 0 || tag.length <= maxLenghtPerTag,
        }"
      >
        <span class="tag-text">{{ tag }}</span>
        <button
          type="button"
          class="tag-remove"
          :aria-label="`Remove tag ${tag}`"
          @click.prevent="removeTag(index)"
          @keydown="(e) => handleKeyNavigation(e, index)"
        >
          <svg
            class="w-3.5 h-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </span>

      <!-- Contenteditable input for typing/pasting tags -->
      <div
        :id="`tags_${id}`"
        ref="textInput"
        contenteditable="true"
        tabindex="0"
        class="input"
        :data-placeholder="isMaxReached
          ? 'Max tags reached'
          : 'Type or paste and press Enter...'"
        :aria-placeholder="isMaxReached
          ? 'Max tags reached'
          : 'Type or paste and press Enter...'"
        @input="handleInput"
        @paste.prevent="handlePaste"
      />
    </div>
    <div v-if="label" class="flex items-center flex-wrap gap-1">
      <span
        v-if="help"
        :id="`help_tags_${id}`"
        class="text-xs text-fv-neutral-500 dark:text-fv-neutral-300"
      >
        {{ help }}
      </span>
    </div>

    <!-- Tag count and copy button container -->
    <div class="flex items-center justify-between mt-2">
      <!-- Tag counter -->
      <div class="tag-counter">
        <span v-if="maxTags > 0">
          {{ model.length }}/{{ maxTags }} tag{{ model.length !== 1 ? 's' : '' }}
        </span>
        <span v-else>
          {{ model.length }} tag{{ model.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Copy button -->
      <button
        v-if="copyButton"
        class="copy-button"
        type="button"
        :disabled="model.length === 0"
        @click.prevent="copyText"
      >
        <svg
          class="w-4 h-4 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
          />
        </svg>
        Copy tags
      </button>
    </div>

    <!-- Inline error display if needed -->
    <p
      v-if="$props.error"
      :id="`error_tags_${id}`"
      class="text-xs text-red-500 mt-1"
      aria-live="assertive"
    >
      {{ $props.error }}
    </p>
  </div>
</template>

<style scoped>
/* Container for all tags plus input */
.tags-input {
  @apply w-full flex flex-wrap gap-2 items-center bg-white
    border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-md
    focus-within:ring-2 focus-within:ring-fv-primary-500 focus-within:border-fv-primary-500
    dark:bg-fv-neutral-800 dark:border-fv-neutral-600
    dark:placeholder-fv-neutral-400 dark:text-white p-2
    dark:focus-within:ring-fv-primary-500 dark:focus-within:border-fv-primary-500
    transition-colors duration-200 ease-in-out shadow-sm;
  cursor: text;
  min-height: 2.5rem;
}

/* Max tags reached state */
.tags-input.max-reached {
  @apply bg-fv-neutral-50 dark:bg-fv-neutral-900;
}

/* Error border */
.tags-input.error {
  @apply border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400 !important;
}

/* Tag base styling */
.tag {
  @apply inline-flex items-center justify-between
    text-sm font-medium rounded-full px-3 py-1
    dark:text-white transition-colors duration-200 ease-in-out;
}

.tag-text {
  @apply mr-1.5;
}

/* Tag remove button */
.tag-remove {
  @apply rounded-full p-0.5 flex items-center justify-center
    hover:bg-black/10 dark:hover:bg-white/20
    focus:outline-none focus:ring-2 focus:ring-offset-1
    transition-colors duration-200;
  height: 18px;
  width: 18px;
}

/* Color variants with modern styling */
.tag-blue {
  @apply bg-blue-200 text-blue-800
    dark:bg-blue-700 dark:text-blue-50
    ring-1 ring-blue-400 dark:ring-blue-600;
}

.tag-red, .tag-error {
  @apply bg-red-200 text-red-800
    dark:bg-red-700 dark:text-red-50
    ring-1 ring-red-400 dark:ring-red-600;
}

.tag-green {
  @apply bg-green-200 text-green-800
    dark:bg-green-700 dark:text-green-50
    ring-1 ring-green-400 dark:ring-green-600;
}

.tag-purple {
  @apply bg-purple-200 text-purple-800
    dark:bg-purple-700 dark:text-purple-50
    ring-1 ring-purple-400 dark:ring-purple-600;
}

.tag-orange {
  @apply bg-orange-200 text-orange-800
    dark:bg-orange-700 dark:text-orange-50
    ring-1 ring-orange-400 dark:ring-orange-600;
}

.tag-neutral {
  @apply bg-fv-neutral-200 text-fv-neutral-800
    dark:bg-fv-neutral-600 dark:text-fv-neutral-50
    ring-1 ring-fv-neutral-400 dark:ring-fv-neutral-500;
}

/* The editable input area for new tags */
.input {
  @apply flex-grow min-w-[100px] outline-none border-none break-words p-1;
  min-height: 1.5rem;
}

/* Placeholder styling */
.input:empty:before {
  content: attr(data-placeholder);
  @apply text-fv-neutral-400 dark:text-fv-neutral-500;
}

/* Copy button styling */
.copy-button {
  @apply inline-flex items-center justify-center
    bg-fv-neutral-100 hover:bg-fv-neutral-200
    text-fv-neutral-700 dark:text-fv-neutral-200
    dark:bg-fv-neutral-700 dark:hover:bg-fv-neutral-600
    px-3 py-1.5 rounded-md text-sm font-medium
    transition-colors duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fv-primary-500
    disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Tag counter styling */
.tag-counter {
  @apply text-sm text-fv-neutral-600 dark:text-fv-neutral-400;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .tags-input {
    @apply p-1.5;
  }
}
</style>
