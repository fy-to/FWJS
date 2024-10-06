<script setup lang="ts">
import { Dialog, DialogPanel, TransitionRoot } from "@headlessui/vue";
import { ref, onMounted, reactive, onUnmounted, h, computed } from "vue";
import type { APIPaging } from "../../composables/rest";
import { useEventBus } from "../../composables/event-bus";
import {
  XCircleIcon,
  ChevronDoubleRightIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ChevronDoubleLeftIcon,
} from "@heroicons/vue/24/solid";
import DefaultPaging from "./DefaultPaging.vue";
import type { Component } from "vue";

const isGalleryOpen = ref<boolean>(false);
const eventBus = useEventBus();
const sidePanel = ref<boolean>(true);

const props = withDefaults(
  defineProps<{
    id: string;
    images: Array<any>;
    title?: string;
    getImageUrl?: Function;
    getThumbnailUrl?: Function;
    onOpen?: Function;
    onClose?: Function;
    closeIcon?: Object;
    gridHeight?: number;
    mode: "mason" | "grid" | "button" | "hidden" | "custom";
    paging?: APIPaging | undefined;
    buttonText?: string;
    buttonType?: string;
    modelValue: number;
    borderColor?: Function;
    imageLoader: string;
    videoComponent?: Component | string;
    imageComponent?: Component | string;
    isVideo?: Function;
    ranking?: boolean;
  }>(),
  {
    modelValue: 0,
    imageComponent: "img",
    mode: "grid",
    gridHeight: 4,
    closeIcon: () => h(XCircleIcon),
    images: () => [],
    isVideo: (image: any) => false,
    getImageUrl: (image: any) => image.image_url,
    getThumbnailUrl: (image: any) => `${image.image_url}?s=250x250&m=autocrop`,
    paging: undefined,
    borderColor: undefined,
    ranking: false,
  },
);

const emit = defineEmits(["update:modelValue"]);
const modelValue = computed({
  get: () => props.modelValue,
  set: (i) => {
    emit("update:modelValue", i);
  },
});

const direction = ref<"next" | "prev">("next");

const setModal = (value: boolean) => {
  if (value === true) {
    if (props.onOpen) props.onOpen();
  } else {
    if (props.onClose) props.onClose();
  }
  isGalleryOpen.value = value;
};

const openGalleryImage = (index: number | undefined) => {
  if (index === undefined) modelValue.value = 0;
  else {
    modelValue.value = parseInt(index.toString());
  }
  setModal(true);
};

const goNextImage = () => {
  direction.value = "next";
  if (modelValue.value < props.images.length - 1) {
    modelValue.value++;
  } else {
    modelValue.value = 0;
  }
};

const goPrevImage = () => {
  direction.value = "prev";
  if (modelValue.value > 0) {
    modelValue.value--;
  } else {
    modelValue.value =
      props.images.length - 1 > 0 ? props.images.length - 1 : 0;
  }
};

const modelValueSrc = computed(() => {
  if (props.images.length == 0) return false;
  if (props.images[modelValue.value] == undefined) return false;
  return props.getImageUrl(props.images[modelValue.value]);
});

const start = reactive({ x: 0, y: 0 });

const touchStart = (event: TouchEvent) => {
  event.preventDefault();
  const touch = event.touches[0];
  start.x = touch.screenX;
  start.y = touch.screenY;
};

const touchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0];
  const end = { x: touch.screenX, y: touch.screenY };

  const diffX = start.x - end.x;
  const diffY = start.y - end.y;

  // Add a threshold to prevent accidental swipes
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    if (diffX > 0) {
      direction.value = "next";
      goNextImage();
    } else {
      direction.value = "prev";
      goPrevImage();
    }
  }
};

const getBorderColor = (i: any) => {
  if (props.borderColor !== undefined) {
    return props.borderColor(i);
  }
  return "";
};

const isKeyPressed = ref<boolean>(false);

const handleKeyboardInput = (event: KeyboardEvent) => {
  if (isKeyPressed.value) return;
  switch (event.key) {
    case "ArrowRight":
      isKeyPressed.value = true;
      direction.value = "next";
      goNextImage();
      break;
    case "ArrowLeft":
      isKeyPressed.value = true;
      direction.value = "prev";
      goPrevImage();
      break;
    default:
      break;
  }
};

const handleKeyboardRelease = (event: KeyboardEvent) => {
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    isKeyPressed.value = false;
  }
};

const closeGallery = () => {
  setModal(false);
};

onMounted(() => {
  eventBus.on(`${props.id}GalleryImage`, openGalleryImage);
  eventBus.on(`${props.id}Gallery`, openGalleryImage);
  eventBus.on(`${props.id}GalleryClose`, closeGallery);
  if (window !== undefined && !import.meta.env.SSR) {
    window.addEventListener("keydown", handleKeyboardInput);
    window.addEventListener("keyup", handleKeyboardRelease);
  }
});

onUnmounted(() => {
  eventBus.off(`${props.id}Gallery`, openGalleryImage);
  eventBus.off(`${props.id}GalleryImage`, openGalleryImage);
  eventBus.off(`${props.id}GalleryClose`, closeGallery);
  if (window !== undefined && !import.meta.env.SSR) {
    window.removeEventListener("keydown", handleKeyboardInput);
    window.removeEventListener("keyup", handleKeyboardRelease);
  }
});
</script>

<template>
  <div>
    <TransitionRoot
      :show="isGalleryOpen"
      as="template"
      enter="duration-300 ease-out"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="duration-200 ease-in"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <Dialog
        :open="isGalleryOpen"
        @close="setModal"
        class="fixed bg-fv-neutral-900 text-white inset-0 max-w-[100vw] overflow-y-auto overflow-x-hidden"
        style="z-index: 37"
      >
        <DialogPanel
          class="relative w-full max-w-full flex flex-col justify-center items-center"
          style="z-index: 38"
        >
          <div class="flex flex-grow gap-4 w-full max-w-full">
            <div class="flex-grow h-[100vh] flex items-center relative">
              <button
                class="btn w-9 h-9 rounded-full absolute top-4 left-2"
                @click="setModal(false)"
                style="z-index: 39"
              >
                <component :is="closeIcon" class="w-8 h-8" />
              </button>

              <div
                class="flex h-[100vh] relative flex-grow items-center justify-center gap-2"
              >
                <div
                  class="hidden lg:relative lg:flex w-10 flex-shrink-0 items-center justify-center flex-0"
                >
                  <button
                    class="btn p-1 rounded-full"
                    v-if="images.length > 1"
                    @click="goPrevImage()"
                  >
                    <ArrowLeftCircleIcon class="w-8 h-8" />
                  </button>
                </div>
                <div
                  class="flex-1 flex flex-col items-center justify-center max-w-full lg:max-w-[calc(100vw - 256px)] relative"
                  @touchstart="touchStart"
                  @touchend="touchEnd"
                >
                  <transition
                    :name="direction === 'next' ? 'slide-next' : 'slide-prev'"
                    mode="out-in"
                  >
                    <div
                      v-if="true"
                      :key="`image-display-${modelValue}`"
                      class="flex-1 w-full max-w-full flex flex-col items-center justify-center absolute inset-0"
                    >
                      <div
                        class="flex-1 w-full max-w-full flex items-center justify-center"
                      >
                        <template
                          v-if="videoComponent && isVideo(images[modelValue])"
                        >
                          <ClientOnly>
                            <component
                              :is="videoComponent"
                              :src="isVideo(images[modelValue])"
                              class="shadow max-w-full h-auto object-contain max-h-[85vh]"
                            />
                          </ClientOnly>
                        </template>
                        <template v-else>
                          <img
                            class="shadow max-w-full h-auto object-contain max-h-[85vh]"
                            :src="modelValueSrc"
                            v-if="modelValueSrc && imageComponent == 'img'"
                          />
                          <component
                            v-else-if="modelValueSrc && imageComponent"
                            :is="imageComponent"
                            :image="modelValueSrc.image"
                            :variant="modelValueSrc.variant"
                            :alt="modelValueSrc.alt"
                            class="shadow max-w-full h-auto object-contain max-h-[85vh]"
                          />
                        </template>
                      </div>
                      <div
                        class="flex-0 py-2 flex items-center justify-center max-w-full w-full"
                      >
                        <slot :value="images[modelValue]"></slot>
                      </div>
                    </div>
                  </transition>
                </div>
                <div
                  class="hidden lg:flex w-10 flex-shrink-0 items-center justify-center"
                >
                  <button
                    class="btn w-9 h-9 rounded-full hidden lg:block absolute top-4"
                    :class="{
                      '-right-4': sidePanel,
                      'right-2': !sidePanel,
                    }"
                    style="z-index: 39"
                    @click="() => (sidePanel = !sidePanel)"
                  >
                    <ChevronDoubleRightIcon class="w-7 h-7" v-if="sidePanel" />
                    <ChevronDoubleLeftIcon class="w-7 h-7" v-else />
                  </button>
                  <button
                    class="btn p-1 rounded-full"
                    @click="goNextImage()"
                    v-if="images.length > 1"
                  >
                    <ArrowRightCircleIcon class="w-8 h-8" />
                  </button>
                </div>
              </div>
            </div>

            <TransitionRoot
              :show="sidePanel"
              as="div"
              enter="transform transition ease-in-out duration-300"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
              class="hidden lg:block flex-shrink-0 w-64 bg-fv-neutral-800 h-[100vh] max-h-[100vh] overflow-y-auto"
            >
              <!-- Side panel content -->
              <div v-if="paging" class="flex items-center justify-center">
                <DefaultPaging :items="paging" :id="id" />
              </div>
              <div class="grid grid-cols-2 gap-2 p-2">
                <div
                  v-for="i in images.length"
                  :key="`bg_${id}_${i}`"
                  class="hover:!brightness-100"
                  :style="{
                    filter:
                      i - 1 == modelValue ? 'brightness(1)' : 'brightness(0.5)',
                  }"
                >
                  <img
                    @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
                    :class="`h-auto max-w-full rounded-lg cursor-pointer shadow  ${getBorderColor(
                      images[i - 1],
                    )}`"
                    :src="getThumbnailUrl(images[i - 1])"
                    v-if="imageComponent == 'img'"
                  />
                  <component
                    v-else
                    @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
                    :is="imageComponent"
                    :image="getThumbnailUrl(images[i - 1]).image"
                    :variant="getThumbnailUrl(images[i - 1]).variant"
                    :alt="getThumbnailUrl(images[i - 1]).alt"
                    :class="`h-auto max-w-full rounded-lg cursor-pointer shadow ${getBorderColor(
                      images[i - 1],
                    )}`"
                  />
                </div>
              </div>
            </TransitionRoot>
          </div>
        </DialogPanel>
      </Dialog>
    </TransitionRoot>

    <template v-if="mode == 'grid' || mode == 'mason' || mode == 'custom'">
      <div
        :class="{
          'grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 items-start':
            mode == 'mason',
          'grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 items-center':
            mode == 'grid',
          'custom-grid': mode == 'custom',
        }"
      >
        <slot name="thumbnail" />
        <template v-for="i in images.length" :key="`g_${id}_${i}`">
          <template v-if="mode == 'mason'">
            <div
              class="grid gap-4 items-start relative"
              v-if="i + (1 % gridHeight) == 0"
            >
              <div v-if="ranking" class="img-gallery-ranking">{{ i }}</div>

              <template v-for="j in gridHeight" :key="`gi_${id}_${i + j}`">
                <div>
                  <img
                    @click="$eventBus.emit(`${id}GalleryImage`, i + j - 2)"
                    class="h-auto max-w-full rounded-lg cursor-pointer"
                    v-if="i + j - 2 < images.length && imageComponent == 'img'"
                    :src="getThumbnailUrl(images[i + j - 2])"
                  />
                  <component
                    v-else-if="i + j - 2 < images.length"
                    :is="imageComponent"
                    :image="getThumbnailUrl(images[i + j - 2]).image"
                    :variant="getThumbnailUrl(images[i + j - 2]).variant"
                    :alt="getThumbnailUrl(images[i + j - 2]).alt"
                    :class="`h-auto max-w-full rounded-lg cursor-pointer ${getBorderColor(
                      images[i + j - 2],
                    )}`"
                    @click="$eventBus.emit(`${id}GalleryImage`, i + j - 2)"
                    :likes="getThumbnailUrl(images[i + j - 2]).likes"
                    :show-likes="getThumbnailUrl(images[i + j - 2]).showLikes"
                    :isAuthor="getThumbnailUrl(images[i + j - 2]).isAuthor"
                    :user-uuid="getThumbnailUrl(images[i + j - 2]).userUUID"
                  />
                </div>
              </template>
            </div>
          </template>
          <div class="relative" v-else>
            <div v-if="ranking" class="img-gallery-ranking">{{ i }}</div>
            <img
              @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
              class="h-auto max-w-full rounded-lg cursor-pointer"
              :src="getThumbnailUrl(images[i - 1])"
              v-if="imageComponent == 'img'"
            />
            <component
              v-else-if="imageComponent"
              :is="imageComponent"
              :image="getThumbnailUrl(images[i - 1]).image"
              :variant="getThumbnailUrl(images[i - 1]).variant"
              :alt="getThumbnailUrl(images[i - 1]).alt"
              :class="`h-auto max-w-full rounded-lg cursor-pointer ${getBorderColor(
                images[i - 1],
              )}`"
              @click="$eventBus.emit(`${id}GalleryImage`, i - 1)"
              :likes="getThumbnailUrl(images[i - 1]).likes"
              :show-likes="getThumbnailUrl(images[i - 1]).showLikes"
              :isAuthor="getThumbnailUrl(images[i - 1]).isAuthor"
              :user-uuid="getThumbnailUrl(images[i - 1]).userUUID"
            />
          </div>
        </template>
      </div>
    </template>
    <button
      v-if="mode == 'button'"
      :class="`btn ${buttonType ? buttonType : 'primary'} defaults`"
      @click="openGalleryImage(0)"
    >
      {{ buttonText ? buttonText : $t("open_gallery_cta") }}
    </button>
  </div>
</template>
<style scoped>
/* Transition styles for next (right) navigation */
.slide-next-enter-active,
.slide-next-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s,
    filter 0.25s;
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(100%);
  filter: blur(10px);
}

.slide-next-enter-to {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

.slide-next-leave-from {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-100%);
  filter: blur(10px);
}

/* Transition styles for prev (left) navigation */
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s,
    filter 0.5s;
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-100%);
  filter: blur(10px);
}

.slide-prev-enter-to {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

.slide-prev-leave-from {
  opacity: 1;
  transform: translateX(0);
  filter: blur(0);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(100%);
  filter: blur(10px);
}

/* Ensure the images are positioned correctly to prevent overlap */
.relative-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.relative-container > div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
