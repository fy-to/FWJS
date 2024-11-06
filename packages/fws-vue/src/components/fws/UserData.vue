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
  <form @submit.prevent="patchUser">
    <DefaultInput
      id="firstnameFWS"
      v-model="state.userData.Firstname"
      class="mb-4"
      type="text"
      :label="$t('fws_firstname_label')"
      :help="$t('fws_firstname_help')"
      :error-vuelidate="v$.userData.Firstname.$errors"
    />
    <DefaultInput
      id="lastnameFWS"
      v-model="state.userData.Lastname"
      class="mb-4"
      type="text"
      :label="$t('fws_lastname_label')"
      :help="$t('fws_lastname_help')"
      :error-vuelidate="v$.userData.Lastname.$errors"
    />
    <DefaultInput
      id="phoneFWS"
      v-model="state.userData.Phone"
      class="mb-4"
      type="text"
      :label="$t('fws_phone_label')"
      :help="$t('fws_phone_help')"
      :error-vuelidate="v$.userData.Phone.$errors"
    />
    <DefaultInput
      v-if="!userData?.AcceptedTerms"
      id="acceptedTermsFWS"
      v-model:checkbox-value="state.userData.AcceptedTerms"
      type="toggle"
      :label="$t('fws_accepted_terms_label')"
      :help="$t('fws_accepted_terms_help')"
      :error-vuelidate="v$.userData.AcceptedTerms.$errors"
    />
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
    <DefaultInput
      id="enabledTrainingFromMyDataFWS"
      v-model:checkbox-value="state.userData.EnabledTrainingFromMyData"
      type="toggle"
      :label="$t('fws_enabled_training_from_my_data_label')"
      :help="$t('fws_enabled_training_from_my_data_help')"
      :error-vuelidate="v$.userData.EnabledTrainingFromMyData.$errors"
    />

    <div class="flex">
      <button type="submit" class="btn defaults primary">
        {{ $t("fws_save_user_cta") }}
      </button>
    </div>
  </form>
</template>
