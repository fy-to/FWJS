<template>
  <div>
    <label class="tag-label" :for="`tags_${id}`">{{ label }}</label>
    <div
      class="tags-input"
      @click="focusInput"
      @keydown.enter.prevent="addTag"
      @keydown.delete="removeLastTag"
    >
      <span v-for="(tag, index) in tags" :key="index" :class="`tag ${color}`">
        {{ tag }}
        <button @click.stop="removeTag(index)" type="button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-3 h-3 text-red-600 dark:text-red-200"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </span>
      <div
        contenteditable
        class="input"
        :id="`tags_${id}`"
        ref="textInput"
        @input="updateInput"
        @paste.prevent="handlePaste"
        placeholder="Add a tag..."
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  color: {
    type: String,
    default: "blue",
  },
  label: {
    type: String,
    default: "Tags",
  },
  id: {
    type: String,
    required: true,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
const tags = ref([...props.modelValue]);
const textInput = ref(null);

watch(
  tags,
  (newTags) => {
    emit("update:modelValue", newTags);
  },
  { deep: true },
);

onMounted(() => {
  if (props.autofocus) {
    focusInput();
  }
});

const updateInput = (event) => {
  const text = event.target.innerText;
  if (text.includes(",")) {
    addTag();
  }
};

const addTag = () => {
  const newTags = textInput.value.innerText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  tags.value.push(...newTags);
  textInput.value.innerText = "";
};

const removeTag = (index) => {
  tags.value.splice(index, 1);
  focusInput();
};

const removeLastTag = () => {
  if (textInput.value.innerText === "") {
    tags.value.pop();
  }
};

const focusInput = () => {
  textInput.value.focus();
};

const handlePaste = (e) => {
  const text = (e.clipboardData || window.clipboardData).getData("text");
  textInput.value.innerText += text;
  e.preventDefault();
};
</script>

<style scoped>
.tags-input {
  cursor: text;
  @apply flex flex-wrap gap-2  items-center shadow-sm bg-fv-neutral-50 border border-fv-neutral-300 text-fv-neutral-900 text-sm rounded-sm focus:ring-fv-primary-500 focus:border-fv-primary-500 w-full p-2.5 dark:bg-fv-neutral-700 dark:border-fv-neutral-600 dark:placeholder-fv-neutral-400 dark:text-white dark:focus:ring-fv-primary-500 dark:focus:border-fv-primary-500;
}
.tag-label {
  @apply block mb-2 text-sm font-medium text-fv-neutral-900 dark:text-white;

  &.error {
    @apply text-red-700 dark:text-red-500;
  }
}
.tag {
  @apply inline-flex gap-1   font-medium  px-2.5 py-0.5 rounded;
  &.blue {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
  }
  &.purple {
    @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
  }
  &.red {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
  }
  &.orange {
    @apply bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200;
  }
  &.neutral {
    @apply bg-fv-neutral-100 text-fv-neutral-800 dark:bg-fv-neutral-900 dark:text-fv-neutral-200;
  }
  &.green {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
  }
}

.input {
  flex-grow: 1;
  min-width: 100px;
  outline: none;
  border: none;
}
</style>
