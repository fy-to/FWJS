<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { email, required } from '@vuelidate/validators'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useKlbStore } from '../../stores/user'
import DefaultInput from '../ui/DefaultInput.vue'

const rest = useRest()

const store = useKlbStore()
const isAuth = computed(() => store.isAuth)
const eventBus = useEventBus()
const isAuthWatcher = ref()
const props = withDefaults(
  defineProps<{
    to?: string
  }>(),
  {
    to: '@support',
  },
)
const globalFormError = ref(null)
const success = ref(false)
const state = reactive({
  contact: {
    fullname: isAuth.value ? store.user?.Profile.Display_Name : '',
    email: isAuth.value ? store.user?.Email : '',
    message: '',
    subject: '',
  },
})
const rules = {
  contact: {
    fullname: { required },
    email: { required, email },
    message: { required },
    subject: { required },
  },
}
const v$ = useVuelidate(rules, state)
async function sendMessage() {
  globalFormError.value = null
  success.value = false
  if (await v$.value.contact.$validate()) {
    eventBus.emit('main-loading', true)
    const sendResult = await rest('Support/Ticket', 'POST', {
      To: props.to,
      Email: state.contact.email,
      Subject: `${state.contact.subject}`,
      Message: state.contact.message,
      Name: state.contact.fullname,
    }).catch((error) => {
      // handle errors here
      eventBus.emit('main-loading', false)
      globalFormError.value = error.error
    })
    if (sendResult && sendResult.result === 'success') {
      success.value = true
    }
    eventBus.emit('main-loading', false)
  }
}
isAuthWatcher.value = watch(isAuth, () => {
  state.contact.fullname = store.user?.Profile.Display_Name
  state.contact.email = store.user?.Email
})
onMounted(() => {})
onUnmounted(() => {
  // if (isAuthWatcher.value) isAuthWatcher.value();
})
</script>

<template>
  <div>
    <form v-if="!success" class="relative" @submit.prevent="sendMessage">
      <div>
        <DefaultInput
          id="emailLogin"
          v-model="state.contact.email"
          :req="true"
          class="mb-4"
          :show-label="true"
          :placeholder="$t('klb_contact_form_place_holder_email')"
          autocomplete="email"
          :error-vuelidate="v$.contact.email.$errors"
          :disabled="isAuth"
          type="email"
          :label="$t('klb_contact_form_label_email')"
        />
        <DefaultInput
          id="fullName"
          v-model="state.contact.fullname"
          :req="true"
          :show-label="true"
          class="mb-4"
          :placeholder="$t('klb_contact_form_label_fullname')"
          autocomplete="name"
          :disabled="isAuth"
          :error-vuelidate="v$.contact.fullname.$errors"
          type="text"
          :label="$t('klb_contact_form_place_holder_fullname')"
        />
        <DefaultInput
          id="subject"
          v-model="state.contact.subject"
          :req="true"
          class="mb-4"
          :show-label="true"
          :placeholder="$t('klb_contact_form_place_holder_subject')"
          :error-vuelidate="v$.contact.subject.$errors"
          type="text"
          :label="$t('klb_contact_form_label_subject')"
        />
        <DefaultInput
          id="message"
          v-model="state.contact.message"
          :req="true"
          class="mb-4"
          :show-label="true"
          :placeholder="$t('klb_contact_form_place_holder_message')"
          :error-vuelidate="v$.contact.message.$errors"
          type="textarea"
          :label="$t('klb_contact_form_label_message')"
        />
        <p
          v-if="globalFormError"
          class="text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300"
        >
          {{ globalFormError }}
        </p>
        <button class="btn primary mt-4 large" type="submit">
          {{ $t("klb_contact_cta") }}
        </button>
      </div>
    </form>
    <p
      v-else
      class="text-sm my-2 p-1 font-semibold text-green-800 dark:text-green-300"
    >
      {{ $t("klb_contact_thanks") }}
    </p>
  </div>
</template>
