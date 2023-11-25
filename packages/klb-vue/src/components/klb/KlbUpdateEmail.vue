<script setup lang="ts">
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { ref, computed, reactive } from "vue";
import { useEventBus } from "../../composables/event-bus";
import DefaultInput from "../ui/DefaultInput.vue";
import DefaultModal from "../ui/DefaultModal.vue";
import { useKlbStore } from "../../stores/user";
import { useRest } from "../../composables/rest";
const rest = useRest();
withDefaults(
  defineProps<{
    showValueButton?: boolean;
  }>(),
  {
    showValueButton: true,
  },
);
const eventBus = useEventBus();
const store = useKlbStore();
const isAuth = computed(() => store.isAuth);
const errorOnSubmit = ref<string | undefined>(undefined);
const rules = {
  updateEmail: {
    email: { required, email },
    pwd: { required },
  },
};
const state = reactive({ updateEmail: { email: "", pwd: "" } });
const v$ = useVuelidate(rules, state);
const changeEmail = async () => {
  errorOnSubmit.value = undefined;
  if (await v$.value.updateEmail.$validate()) {
    const _updateResult = await rest("User/@:setEmail", "POST", {
      email: state.updateEmail.email,
      current_password: state.updateEmail.pwd,
    }).catch((err) => {
      errorOnSubmit.value = err.token;
    });
    if (_updateResult && _updateResult.result == "success") {
      await store.refreshUser();
      eventBus.emit("updateEmailModal", false);
    }
  }
};
</script>
<template>
  <div v-if="isAuth">
    <DefaultModal id="updateEmail" :title="$t('update_email_modal_title')">
      <form @submit.prevent="changeEmail">
        <div class="klb-account-grid-inputs">
          <DefaultInput
            id="currPwd"
            :req="true"
            :showLabel="true"
            :placeholder="$t('update_email_form_pwd_placeholder')"
            :errorVuelidate="v$.updateEmail.pwd.$errors"
            v-model="state.updateEmail.pwd"
            :label="$t('update_email_form_pwd_label')"
            type="password"
            autocomplete="off"
            class="mb-4"
          ></DefaultInput>
          <DefaultInput
            id="newEmail"
            :req="true"
            :showLabel="true"
            :placeholder="$t('update_email_form_email_placeholder')"
            :errorVuelidate="v$.updateEmail.email.$errors"
            v-model="state.updateEmail.email"
            :label="$t('update_email_form_email_label')"
            autocomplete="off"
            type="email"
            class="mb-4"
          ></DefaultInput>
        </div>
        <div class="form-error-label" v-if="errorOnSubmit">
          {{ errorOnSubmit }}
        </div>
        <button class="defaults btn primary" type="submit">
          {{ $t("update_email_cta") }}
        </button>
      </form>
    </DefaultModal>
  </div>
</template>
