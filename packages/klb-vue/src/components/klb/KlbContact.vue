<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useKlbStore } from "../../stores/user";
import { email, required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { useEventBus } from "../../composables/event-bus";
import DefaultInput from "../ui/DefaultInput.vue";
import { useRest } from "../../composables/rest";
const rest = useRest();

const store = useKlbStore();
const isAuth = computed(() => store.isAuth);
const eventBus = useEventBus();
const isAuthWatcher = ref();
const props = withDefaults(
  defineProps<{
    to?: string;
  }>(),
  {
    to: "@support",
  },
);
const globalFormError = ref(null);
const success = ref(false);
const state = reactive({
  contact: {
    fullname: isAuth.value ? store.user?.Profile.Display_Name : "",
    email: isAuth.value ? store.user?.Email : "",
    message: "",
    subject: "",
  },
});
const rules = {
  contact: {
    fullname: { required },
    email: { required, email },
    message: { required },
    subject: { required },
  },
};
const v$ = useVuelidate(rules, state);
const sendMessage = async () => {
  globalFormError.value = null;
  success.value = false;
  if (await v$.value.contact.$validate()) {
    eventBus.emit("main-loading", true);
    const sendResult = await rest("Support/Ticket", "POST", {
      To: props.to,
      Email: state.contact.email,
      Subject: `${state.contact.subject}`,
      Message: state.contact.message,
      Name: state.contact.fullname,
    }).catch((error) => {
      // handle errors here
      eventBus.emit("main-loading", false);
      globalFormError.value = error.error;
    });
    if (sendResult && sendResult.result == "success") {
      success.value = true;
    }
    eventBus.emit("main-loading", false);
  }
};
isAuthWatcher.value = watch(isAuth, () => {
  state.contact.fullname = store.user?.Profile.Display_Name;
  state.contact.email = store.user?.Email;
});
onMounted(() => {});
onUnmounted(() => {
  //if (isAuthWatcher.value) isAuthWatcher.value();
});
</script>
<template>
  <div>
    <form @submit.prevent="sendMessage" v-if="!success" class="relative">
      <div>
        <DefaultInput
          id="emailLogin"
          :req="true"
          class="mb-4"
          :showLabel="true"
          :placeholder="$t('klb_contact_form_place_holder_email')"
          autocomplete="email"
          :errorVuelidate="v$.contact.email.$errors"
          v-model="state.contact.email"
          :disabled="isAuth"
          type="email"
          :label="$t('klb_contact_form_label_email')"
        >
        </DefaultInput>
        <DefaultInput
          id="fullName"
          :req="true"
          :showLabel="true"
          class="mb-4"
          :placeholder="$t('klb_contact_form_label_fullname')"
          autocomplete="name"
          :disabled="isAuth"
          :errorVuelidate="v$.contact.fullname.$errors"
          v-model="state.contact.fullname"
          type="text"
          :label="$t('klb_contact_form_place_holder_fullname')"
        >
        </DefaultInput>
        <DefaultInput
          id="subject"
          :req="true"
          class="mb-4"
          :showLabel="true"
          :placeholder="$t('klb_contact_form_place_holder_subject')"
          :errorVuelidate="v$.contact.subject.$errors"
          v-model="state.contact.subject"
          type="text"
          :label="$t('klb_contact_form_label_subject')"
        >
        </DefaultInput>
        <DefaultInput
          id="message"
          :req="true"
          class="mb-4"
          :showLabel="true"
          :placeholder="$t('klb_contact_form_place_holder_message')"
          :errorVuelidate="v$.contact.message.$errors"
          v-model="state.contact.message"
          type="textarea"
          :label="$t('klb_contact_form_label_message')"
        >
        </DefaultInput>
        <p
          class="text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300"
          v-if="globalFormError"
        >
          {{ globalFormError }}
        </p>
        <button class="btn primary mt-4 large" type="submit">
          {{ $t("klb_contact_cta") }}
        </button>
      </div>
    </form>
    <p
      class="text-sm my-2 p-1 font-semibold text-green-800 dark:text-green-300"
      v-else
    >
      {{ $t("klb_contact_thanks") }}
    </p>
  </div>
</template>
