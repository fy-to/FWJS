<script setup lang="ts">
import { Uploader } from '@fy-/fws-js'
import useVuelidate from '@vuelidate/core'
import { maxLength, required } from '@vuelidate/validators'
import { computed, reactive, ref, watchEffect } from 'vue'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useUserStore } from '../../stores/user'
import DefaultInput from '../ui/DefaultInput.vue'
import DefaultModal from '../ui/DefaultModal.vue'

const props = withDefaults(
  defineProps<{
    imageDomain?: string
    onCompleted?: (data: any) => void
    hidePublic?: boolean
    hideBirthdate?: boolean
    hideGender?: boolean
  }>(),
  {
    imageDomain: 'https://s.nocachenocry.com',
    onCompleted: () => {},
    hidePublic: false,
    hideBirthdate: false,
    hideGender: false,
  },
)
const rest = useRest()
const userStore = useUserStore()
const userData = computed(() => userStore.user)
const eventBus = useEventBus()
// Default date = 18y from now
const currentDate = new Date()
const defaultDate = new Date(
  currentDate.setFullYear(currentDate.getFullYear() - 18),
)
  .toISOString()
  .split('T')[0]

const state = reactive({
  userData: {
    Username: userData.value?.UserProfile?.Username || '',
    Gender: userData.value?.UserProfile?.Gender || '',
    Bio: userData.value?.UserProfile?.Bio || '',
    Birthdate: userData.value?.UserProfile?.Birthdate || defaultDate,
    PublicGender: userData.value?.UserProfile?.PublicGender || false,
    PublicBio: userData.value?.UserProfile?.PublicBio || false,
    PublicBirthdate: userData.value?.UserProfile?.PublicBirthdate || false,
  },
  usernameUpdate: {
    Username: userData.value?.UserProfile?.Username || '',
  },
})
watchEffect(() => {
  state.userData = {
    Username: userData.value?.UserProfile?.Username || '',
    Gender: userData.value?.UserProfile?.Gender || '',
    Bio: userData.value?.UserProfile?.Bio || '',
    Birthdate: userData.value?.UserProfile?.Birthdate
      ? new Date(userData.value?.UserProfile?.Birthdate.unixms)
        .toISOString()
        .split('T')[0]
      : defaultDate,
    PublicGender: userData.value?.UserProfile?.PublicGender || false,
    PublicBio: userData.value?.UserProfile?.PublicBio || false,
    PublicBirthdate: userData.value?.UserProfile?.PublicBirthdate || false,
  }
})
const rules = {
  userData: {
    Username: {
      required,
    },
    Gender: {},
    Bio: {
      maxLength: maxLength(1000),
    },
    Birthdate: {},
    PublicGender: {},
    PublicBio: {},
    PublicBirthdate: {},
  },
  usernameUpdate: {
    Username: {
      required,
    },
  },
}
const v$ = useVuelidate(rules, state)

async function patchUser() {
  eventBus.emit('main-loading', true)
  if (await v$.value.userData.$validate()) {
    const data = { ...state.userData }
    const birtdate = new Date(`${data.Birthdate}T00:00:00Z`)
    try {
      const birtdateAtUnixms = birtdate.getTime()
      data.Birthdate = new Date(birtdateAtUnixms).toISOString().split('T')[0]
    }
    catch {
      // @ts-expect-error: Birthdate is a string
      data.Birthdate = data.Birthdate.toISOString().split('T')[0]
    }
    const response = await rest('User/_Profile', 'PATCH', data)
    if (response && response.result === 'success') {
      if (props.onCompleted) {
        props.onCompleted(response)
      }
      eventBus.emit('user:refresh', true)
    }
  }
  eventBus.emit('main-loading', false)
}
const uploadInput = ref<HTMLInputElement | null>(null)
const pic = ref<string>('')
const cropResult = reactive({
  dataURL: '',
  blobURL: '',
})
const uploader = ref(new Uploader())
const canUpdateUsername = computed(() => {
  // If user and UserProfile and UserProfile.UsernameChangedAt > 30 days
  if (userData.value?.UserProfile?.UsernameChangedAt?.unixms) {
    const date = new Date(userData.value?.UserProfile?.UsernameChangedAt.unixms)
    const now = new Date()
    const diff = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24))
    return diffDays > 30
  }
  return true
})
const lastUsernameError = ref('')
async function updateUsername() {
  eventBus.emit('main-loading', true)
  if (await v$.value.usernameUpdate.$validate()) {
    const data = { ...state.usernameUpdate }
    const response = await rest('User/_Username', 'PATCH', data).catch((err) => {
      eventBus.emit('main-loading', false)
      lastUsernameError.value = err.message
    })
    if (response && response.result === 'success') {
      if (props.onCompleted) {
        props.onCompleted(response)
      }
      eventBus.emit('user:refresh', true)
      eventBus.emit('updateUsernameModal', false)
    }
  }
  eventBus.emit('main-loading', false)
}

async function getCropResult() {
  if (!cropper) return
  const base64 = cropper.getDataURL({})
  const blob: Blob | null = await cropper.getBlob()
  if (!blob) return
  eventBus.emit('main-loading', true)

  const file = await cropper.getFile({
    fileName: `avatar-${userData.value?.UUID}`,
  })

  cropResult.dataURL = base64
  cropResult.blobURL = URL.createObjectURL(blob)
  if (file) {
    uploader.value.addFile(file)
  }
  const fileUploadCallback = (response: any) => {
    if (props.onCompleted) {
      props.onCompleted(response)
    }
    eventBus.emit('avCropModal', false)
    eventBus.emit('main-loading', false)
    eventBus.emit('user:refresh', true)
  }
  uploader.value.startUpload(`/_special/rest/User/_Avatar`, fileUploadCallback)
}

function selectFile(e: Event) {
  pic.value = ''
  cropResult.dataURL = ''
  cropResult.blobURL = ''

  const { files } = e.target as HTMLInputElement
  if (!files || !files.length) return

  const file = files[0]
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    pic.value = String(reader.result)
    eventBus.emit('avCropModal', true)
    if (!uploadInput.value) return
    uploadInput.value.value = ''
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="patchUser">
    <DefaultModal id="updateUsername" :title="$t('fws_username_update_title')">
      <div class="flex flex-col gap-4">
        <DefaultInput
          id="usernameFWS"
          v-model="state.usernameUpdate.Username"
          type="text"
          :label="$t('fws_username_label')"
          :help="$t('fws_username_help')"
          :error-vuelidate="v$.usernameUpdate.Username.$errors"
          :disabled="!canUpdateUsername"
        />
        <div v-if="lastUsernameError" class="text-xs text-red-500">
          {{ lastUsernameError }}
        </div>
        <div class="flex justify-end pt-2">
          <button type="submit" class="btn defaults primary flex items-center gap-2" @click="updateUsername">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {{ $t("fws_save_user_cta") }}
          </button>
        </div>
      </div>
    </DefaultModal>
    <div class="bg-white dark:bg-fv-neutral-900 p-4 sm:p-6 rounded-lg shadow-sm border border-fv-neutral-200 dark:border-fv-neutral-700">
      <h3 class="text-lg font-semibold text-fv-neutral-900 dark:text-white mb-4 pb-2 border-b border-fv-neutral-200 dark:border-fv-neutral-700">
        {{ $t('fws_profile_heading') || $t('fws_your_profile') }}
      </h3>

      <!-- Username and Avatar Section -->
      <div class="grid md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <!-- Avatar Upload -->
        <div class="flex flex-col">
          <h4 class="font-medium text-fv-neutral-800 dark:text-white text-sm mb-3">
            {{ $t("fws_profile_image") }}
          </h4>
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="relative group">
              <img
                v-if="userData?.UserProfile?.AvatarUUID"
                :src="`${imageDomain}/${userData?.UserProfile?.AvatarUUID}?vars=format=png:resize=100x100`"
                class="w-20 h-20 rounded-full object-cover border-2 border-fv-neutral-200 dark:border-fv-neutral-700 shadow-sm"
                alt="Profile Avatar"
              >
              <div v-else class="w-20 h-20 rounded-full bg-fv-neutral-200 dark:bg-fv-neutral-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-fv-neutral-400 dark:text-fv-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>

            <div class="flex-1">
              <label
                class="block text-sm font-medium mb-2 text-fv-neutral-800 dark:text-white"
                for="file_input"
              >{{ $t("fws_upload_av_label") }}</label>
              <div class="relative">
                <input
                  id="file_input"
                  ref="uploadInput"
                  class="block text-sm w-full text-fv-neutral-700 border border-fv-neutral-300 rounded-lg cursor-pointer bg-fv-neutral-50 dark:text-fv-neutral-400 focus:outline-none dark:bg-fv-neutral-700 dark:border-fv-neutral-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-fv-primary-50 file:text-fv-primary-600 dark:file:bg-fv-primary-900 dark:file:text-fv-primary-300 hover:file:bg-fv-primary-100 dark:hover:file:bg-fv-primary-800"
                  type="file"
                  accept="image/jpg, image/jpeg, image/png, image/gif"
                  @change="selectFile"
                >
              </div>
              <p class="mt-1 text-xs text-fv-neutral-500 dark:text-fv-neutral-400">
                {{ $t("fws_upload_av_help") || "JPG, JPEG, PNG or GIF (max 2MB)" }}
              </p>
            </div>
          </div>
        </div>

        <!-- Username -->
        <div class="flex flex-col justify-center">
          <DefaultInput
            id="usernameFWS"
            v-model="state.userData.Username"
            type="text"
            :label="$t('fws_username_label')"
            :help="$t('fws_username_help')"
            :error-vuelidate="v$.userData.Username.$errors"
            :disabled="userData?.UserProfile?.HasUsernameAndSlug ? true : false"
          />
          <div v-if="!canUpdateUsername" class="text-xs text-fv-neutral-500 dark:text-fv-neutral-400 mt-1">
            {{ $t('fws_username_update_help') }}
          </div>
          <div v-else>
            <button
              type="button"
              class="btn small primary mt-1"
              @click="$eventBus.emit('updateUsernameModal', true)"
            >
              {{ $t('fws_username_update_cta') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Cropper Modal -->
      <DefaultModal id="avCrop" :title="$t('fws_crop_av_title')">
        <div class="flex flex-col gap-4">
          <div class="max-h-[70vh] overflow-hidden rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-700">
            <VuePictureCropper
              :box-style="{
                width: 'auto',
                height: 'auto',
                backgroundColor: '#f8f8f8',
                margin: 'auto',
              }"
              :img="pic"
              :options="{
                viewMode: 1,
                dragMode: 'crop',
                aspectRatio: 1 / 1,
              }"
              class="max-h-[70vh] w-full"
            />
          </div>
          <button class="btn defaults primary self-end" @click="getCropResult">
            {{ $t("fws_crop_av_cta") }}
          </button>
        </div>
      </DefaultModal>

      <!-- Profile Information -->
      <div class="grid md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4 mb-4 sm:mb-6">
        <DefaultInput
          id="genderFWS"
          v-model="state.userData.Gender"
          type="select"
          :options="[
            ['female', $t('fws_persona_phys_appearance_opt_female')],
            ['male', $t('fws_persona_phys_appearance_opt_male')],
            ['non-binary', $t('fws_persona_phys_appearance_opt_non_binary')],
          ]"
          :label="$t('fws_gender_label')"
          :error-vuelidate="v$.userData.Gender.$errors"
        />

        <DefaultInput
          id="birthdateFWS"
          v-model="state.userData.Birthdate"
          type="datepicker"
          :disable-dates-under18="true"
          :label="$t('fws_birthdate_label')"
          :error-vuelidate="v$.userData.Birthdate.$errors"
        />
      </div>

      <!-- Bio -->
      <div class="mb-4 sm:mb-6">
        <DefaultInput
          id="bioFWS"
          v-model="state.userData.Bio"
          type="textarea"
          :label="$t('fws_bio_label')"
          :error-vuelidate="v$.userData.Bio.$errors"
          :dp-options="{ counterMax: 1000 }"
        />
      </div>

      <!-- Privacy Settings -->
      <template v-if="!hidePublic">
        <div class="pt-3 sm:pt-4 border-t border-fv-neutral-200 dark:border-fv-neutral-700 mb-3 sm:mb-4">
          <h4 class="font-medium text-fv-neutral-800 dark:text-white mb-3">
            {{ $t('fws_privacy_settings') }}
          </h4>
          <div class="grid gap-2">
            <DefaultInput
              v-if="!hideGender"
              id="publicGenderFWS"
              v-model:checkbox-value="state.userData.PublicGender"
              type="toggle"
              :label="$t('fws_public_gender')"
              :error-vuelidate="v$.userData.PublicGender.$errors"
            />
            <DefaultInput
              id="publicBioFWS"
              v-model:checkbox-value="state.userData.PublicBio"
              type="toggle"
              :label="$t('fws_public_bio')"
              :error-vuelidate="v$.userData.PublicBio.$errors"
            />
            <DefaultInput
              v-if="!hideBirthdate"
              id="publicBirthdateFWS"
              v-model:checkbox-value="state.userData.PublicBirthdate"
              type="toggle"
              :label="$t('fws_public_birthdate')"
              :error-vuelidate="v$.userData.PublicBirthdate.$errors"
            />
          </div>
        </div>
      </template>

      <!-- Save Button -->
      <div class="flex justify-end pt-2">
        <button type="submit" class="btn defaults primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          {{ $t("fws_save_user_cta") }}
        </button>
      </div>
    </div>
  </form>
</template>
