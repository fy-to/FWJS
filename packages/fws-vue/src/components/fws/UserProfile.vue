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
  <form @submit.prevent="patchUser">
    <DefaultInput
      id="usernameFWS"
      v-model="state.userData.Username"
      class="mb-4"
      type="text"
      :label="$t('fws_username_label')"
      :help="$t('fws_username_help')"
      :error-vuelidate="v$.userData.Username.$errors"
      :disabled="userData?.UserProfile?.HasUsernameAndSlug ? true : false"
    />
    <div class="flex gap-2 items-center mb-4">
      <img
        v-if="userData?.UserProfile?.AvatarUUID"
        :src="`${imageDomain}/${userData?.UserProfile?.AvatarUUID}?vars=format=png:resize=100x100`"
        class="w-16 h-16 rounded-full flex-0 shrink-0 grow-0"
      >
      <div class="flex-1">
        <label
          class="block text-sm font-medium mb-2 text-neutral-900 dark:text-white"
          for="file_input"
        >{{ $t("fws_upload_av_label") }}</label>
        <input
          ref="uploadInput"
          class="block text-sm w-full text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 dark:text-neutral-400 focus:outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-400"
          type="file"
          accept="image/jpg, image/jpeg, image/png, image/gif"
          @change="selectFile"
        >
      </div>
    </div>
    <DefaultModal id="avCrop" :title="$t('fws_crop_av_title')">
      <button class="btn defaults primary" @click="getCropResult">
        {{ $t("fws_crop_av_cta") }}
      </button>
      <div class="max-h-[80vh]">
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
    </DefaultModal>
    <DefaultInput
      id="genderFWS"
      v-model="state.userData.Gender"
      class="mb-4"
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
      class="mb-4"
      type="datepicker"
      :disable-dates-under18="true"
      :label="$t('fws_birthdate_label')"
      :error-vuelidate="v$.userData.Birthdate.$errors"
    />
    <DefaultInput
      id="bioFWS"
      v-model="state.userData.Bio"
      class="mb-4"
      type="textarea"
      :label="$t('fws_bio_label')"
      :error-vuelidate="v$.userData.Bio.$errors"
    />
    <template v-if="!hidePublic">
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
    </template>
    <div class="flex">
      <button type="submit" class="btn defaults primary">
        {{ $t("fws_save_user_cta") }}
      </button>
    </div>
  </form>
</template>
