<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import { computed, reactive, watchEffect } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useUserStore } from '../../stores/user'
import DefaultInput from '../ui/DefaultInput.vue'

const rest = useRest()
const userStore = useUserStore()
const userData = computed(() => userStore.user)
const eventBus = useEventBus()
const props = withDefaults(
  defineProps<{
    onCompleted?: (data: any) => void
  }>(),
  {
    onCompleted: () => {},
  },
)
const state = reactive({
  userData: {
    Firstname: userData.value?.Firstname || '',
    Lastname: userData.value?.Lastname || '',
    Phone: userData.value?.Phone || '',
    AcceptedTerms: userData.value?.AcceptedTerms || false,
    EnabledNotifications: userData.value?.EnabledNotifications || false,
    EnabledEmails: userData.value?.EnabledEmails || false,
    EnabledTrainingFromMyData:
      userData.value?.EnabledTrainingFromMyData || false,
  },
})
watchEffect(() => {
  state.userData = {
    Firstname: userData.value?.Firstname || '',
    Lastname: userData.value?.Lastname || '',
    Phone: userData.value?.Phone || '',
    AcceptedTerms: userData.value?.AcceptedTerms || false,
    EnabledNotifications: userData.value?.EnabledNotifications || false,
    EnabledEmails: userData.value?.EnabledEmails || false,
    EnabledTrainingFromMyData:
      userData.value?.EnabledTrainingFromMyData || false,
  }
})
const rules = {
  userData: {
    Firstname: {},
    Lastname: {},
    Phone: {},
    Bio: {},
    AcceptedTerms: {},
    EnabledNotifications: {},
    EnabledEmails: {},
    EnabledTrainingFromMyData: {},
  },
}
const v$ = useVuelidate(rules, state)

async function patchUser() {
  eventBus.emit('main-loading', true)
  if (await v$.value.userData.$validate()) {
    const response = await rest('User', 'PATCH', state.userData)
    if (response && response.result === 'success') {
      eventBus.emit('user:refresh', true)
      if (props.onCompleted) {
        props.onCompleted(response)
      }
    }
  }
  eventBus.emit('main-loading', false)
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="patchUser">
    <div class="bg-white dark:bg-fv-neutral-900 p-4 sm:p-6 rounded-lg shadow-sm border border-fv-neutral-200 dark:border-fv-neutral-700">
      <h3 class="text-lg font-semibold text-fv-neutral-900 dark:text-white mb-4 sm:mb-5 pb-2 border-b border-fv-neutral-200 dark:border-fv-neutral-700">
        {{ $t('fws_personal_data_title') || $t('fws_personal_information') }}
      </h3>

      <!-- Personal Information Section -->
      <div class="grid gap-4 md:grid-cols-2 mb-4 sm:mb-6">
        <DefaultInput
          id="firstnameFWS"
          v-model="state.userData.Firstname"
          type="text"
          :label="$t('fws_firstname_label')"
          :help="$t('fws_firstname_help')"
          :error-vuelidate="v$.userData.Firstname.$errors"
        />
        <DefaultInput
          id="lastnameFWS"
          v-model="state.userData.Lastname"
          type="text"
          :label="$t('fws_lastname_label')"
          :help="$t('fws_lastname_help')"
          :error-vuelidate="v$.userData.Lastname.$errors"
        />
        <DefaultInput
          id="phoneFWS"
          v-model="state.userData.Phone"
          type="text"
          :label="$t('fws_phone_label')"
          :help="$t('fws_phone_help')"
          :error-vuelidate="v$.userData.Phone.$errors"
        />
      </div>

      <!-- Terms & Preferences -->
      <div class="pt-3 sm:pt-4 border-t border-fv-neutral-200 dark:border-fv-neutral-700">
        <h4 class="font-medium text-fv-neutral-800 dark:text-white mb-2 sm:mb-3">
          {{ $t('fws_preferences_and_settings') }}
        </h4>

        <div class="grid gap-2 sm:gap-3 p-1 sm:p-2">
          <DefaultInput
            v-if="!userData?.AcceptedTerms"
            id="acceptedTermsFWS"
            v-model:checkbox-value="state.userData.AcceptedTerms"
            type="toggle"
            :label="$t('fws_accepted_terms_label')"
            :help="$t('fws_accepted_terms_help')"
            :error-vuelidate="v$.userData.AcceptedTerms.$errors"
          />

          <div class="grid gap-3 md:grid-cols-2 my-1">
            <DefaultInput
              id="enabledNotificationsFWS"
              v-model:checkbox-value="state.userData.EnabledNotifications"
              type="toggle"
              :label="$t('fws_enabled_notifications_label')"
              :help="$t('fws_enabled_notifications_help')"
              :error-vuelidate="v$.userData.EnabledNotifications.$errors"
            />
            <DefaultInput
              id="enabledEmailsFWS"
              v-model:checkbox-value="state.userData.EnabledEmails"
              type="toggle"
              :label="$t('fws_enabled_emails_label')"
              :help="$t('fws_enabled_emails_help')"
              :error-vuelidate="v$.userData.EnabledEmails.$errors"
            />
          </div>

          <DefaultInput
            id="enabledTrainingFromMyDataFWS"
            v-model:checkbox-value="state.userData.EnabledTrainingFromMyData"
            type="toggle"
            :label="$t('fws_enabled_training_from_my_data_label')"
            :help="$t('fws_enabled_training_from_my_data_help')"
            :error-vuelidate="v$.userData.EnabledTrainingFromMyData.$errors"
          />
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end mt-6">
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
