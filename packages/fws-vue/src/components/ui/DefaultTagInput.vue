<template>
  <div
    :class="`tags-input ${$props.error ? 'error' : ''}`"
    @click="focusInput"
    @keydown.delete.prevent="removeLastTag"
    @keydown.enter.prevent="addTag"
  >
    <span v-for="(tag, index) in model" :key="index" :class="`tag ${color}`">
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
      contenteditable
      class="input"
      :id="`tags_${id}`"
      ref="textInput"
      @input="handleInput"
      @paste.prevent="handlePaste"
      placeholder="Add a tag..."
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
type colorType = "blue" | "red" | "green" | "purple" | "orange" | "neutral";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    color?: colorType;
    label?: string;
    id: string;
    separators?: string[];
    autofocus?: boolean;
    help?: string;
    error?: string;
  }>(),
  {
    color: "blue",
    label: "Tags",
    separators: () => [","],
    autofocus: false,
  },
);

const textInput = ref<HTMLElement>();

const emit = defineEmits(["update:modelValue"]);
const model = computed({
  get: () => props.modelValue,
  set: (items) => {
    emit("update:modelValue", items);
  },
});

onMounted(() => {
  if (props.autofocus) {
    focusInput();
  }
});

const handleInput = (event: any) => {
  const separatorsRegex = new RegExp(props.separators.join("|"));
  if (separatorsRegex.test(event.data)) {
    addTag();
  }
};

const addTag = () => {
  if (!textInput.value) return;

  const separatorsRegex = new RegExp(props.separators.join("|"));
  const newTags = textInput.value.innerText
    .split(separatorsRegex)
    .map((tag: string) => tag.trim())
    .filter((tag: string) => tag.length > 0);
  model.value.push(...newTags);
  textInput.value.innerText = "";
};

const removeTag = (index: number) => {
  model.value.splice(index, 1);
  focusInput();
};

const removeLastTag = () => {
  if (!textInput.value) return;
  if (textInput.value.innerText === "") {
    model.value.pop();
  } else {
    const currentLength = textInput.value.innerText.length;
    textInput.value.innerText = textInput.value.innerText.slice(0, -1);

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(textInput.value);
    range.collapse(false);
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }
};
const focusInput = () => {
  if (!textInput.value) return;

  textInput.value.focus();
};

const handlePaste = (e: any) => {
  if (!textInput.value) return;

  // @ts-ignore
  const text = (e.clipboardData || window.clipboardData).getData("text");
  const separatorsRegex = new RegExp(props.separators.join("|"), "g");
  const pasteText = text.replace(separatorsRegex, ",");
  textInput.value.innerText += pasteText;
  e.preventDefault();
  addTag();
};
</script>

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
