<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import { helpers, required } from '@vuelidate/validators'
import { computed, reactive, watchEffect } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useTranslation } from '../../composables/translations'
import { useUserStore } from '../../stores/user'
import DefaultInput from '../ui/DefaultInput.vue'

const rest = useRest()
const props = withDefaults(
  defineProps<{
    onCompleted?: (data: any) => void
    termsText?: string
    force18?: boolean
  }>(),
  {
    onCompleted: () => {},
    termsText: '',
    force18: false,
  },
)
const currentDate = new Date()
const defaultDate = new Date(
  currentDate.setFullYear(currentDate.getFullYear() - 18),
)
  .toISOString()
  .split('T')[0]

function ageValidator(value: any) {
  const today = new Date()
  const birthDate = new Date(value)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age >= 18 && age <= 2020
}
const userStore = useUserStore()
const userData = computed(() => userStore.user)
const eventBus = useEventBus()
const state = reactive({
  userData: {
    Username: userData.value?.UserProfile?.Username || '',
    Gender: userData.value?.UserProfile?.Gender || '',
    Birthdate: userData.value?.UserProfile?.Birthdate || defaultDate,
    AcceptedTerms: userData.value?.AcceptedTerms || true,
  },
})
watchEffect(() => {
  state.userData = {
    Username: userData.value?.UserProfile?.Username || '',
    Gender: userData.value?.UserProfile?.Gender || '',
    Birthdate: userData.value?.UserProfile?.Birthdate
      ? new Date(userData.value?.UserProfile?.Birthdate.unixms)
        .toISOString()
        .split('T')[0]
      : defaultDate,
    AcceptedTerms: userData.value?.AcceptedTerms || true,
  }
})
const translate = useTranslation()
const rules = {
  userData: {
    Username: {
      required,
    },
    Gender: {
      required,
    },
    Birthdate: {
      required,
      ageValidator: props.force18
        ? helpers.withMessage(
            translate('fws_under_18_error_message'),
            ageValidator,
          )
        : undefined,
    },
    AcceptedTerms: {
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
    const response = await rest('User/_ForceProfile', 'PATCH', data)
    if (response && response.result === 'success') {
      if (props.onCompleted) {
        props.onCompleted(response)
      }
      eventBus.emit('user:refresh', true)
    }
  }
  eventBus.emit('main-loading', false)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="patchUser">
    <div class="bg-white dark:bg-fv-neutral-900 p-4 sm:p-6 rounded-lg shadow-sm border border-fv-neutral-200 dark:border-fv-neutral-700">
      <h3 class="text-lg font-semibold text-fv-neutral-900 dark:text-white mb-4 pb-2 border-b border-fv-neutral-200 dark:border-fv-neutral-700">
        {{ $t('fws_user_profile_title') || $t('fws_profile_settings') }}
      </h3>

      <div class="grid gap-4">
        <DefaultInput
          id="usernameFWS"
          v-model="state.userData.Username"
          type="text"
          :label="$t('fws_username_label')"
          :help="$t('fws_username_help')"
          :error-vuelidate="v$.userData.Username.$errors"
          :disabled="userData?.UserProfile?.HasUsernameAndSlug ? true : false"
        />

        <DefaultInput
          id="birthdateFWS"
          v-model="state.userData.Birthdate"
          :disable-dates-under18="true"
          type="datepicker"
          :label="$t('fws_birthdate_label')"
          :error-vuelidate="v$.userData.Birthdate.$errors"
        />

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

        <div class="mt-2 pt-3 border-t border-fv-neutral-200 dark:border-fv-neutral-700">
          <DefaultInput
            id="acceptedTermsFWS"
            v-model:checkbox-value="state.userData.AcceptedTerms"
            type="toggle"
            :label="$t('fws_accepted_terms_label')"
            :help="$t('fws_accepted_terms_help')"
            :error-vuelidate="v$.userData.AcceptedTerms.$errors"
          />
          <p v-if="props.termsText" class="mt-2 p-2 sm:p-3 text-sm bg-fv-neutral-50 dark:bg-fv-neutral-700 rounded border border-fv-neutral-200 dark:border-fv-neutral-600 text-fv-neutral-700 dark:text-fv-neutral-300">
            {{ props.termsText }}
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
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
