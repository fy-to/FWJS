<script setup lang="ts">
import useVuelidate from "@vuelidate/core";
import { required, sameAs } from "@vuelidate/validators";
import { ref, computed } from "vue";
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
const pwd = ref<string>();
const pwdConfirm = ref<string>();
const oldPwd = ref<string>();
const errorOnSubmit = ref<string | undefined>(undefined);
const rules = {
  oldPwd: { required },
  pwd: { required },
  pwdConfirm: { req: required, sameAs: sameAs(pwd) },
};
const v$ = useVuelidate(rules, { oldPwd, pwd, pwdConfirm });
const changeEmail = async () => {
  errorOnSubmit.value = undefined;
  if (await v$.value.$validate()) {
    const _updateResult = await rest("User/@:setPassword", "POST", {
      old_password: oldPwd.value,
      password: pwd.value,
    }).catch((err) => {
      errorOnSubmit.value = err.token;
    });
    if (_updateResult && _updateResult.result == "success") {
      await store.refreshUser();
      eventBus.emit("updatePasswordModal", false);
    }
  }
};
</script>
<template>
  <div v-if="isAuth">
    <DefaultModal id="updatePassword" :title="$t('update_pwd_modal_title')">
      <form @submit.prevent="changeEmail">
        <div class="klb-account-grid-inputs">
          <DefaultInput
            id="newPwd"
            :req="true"
            :showLabel="true"
            :placeholder="$t('update_pwd_form_newPwd_placeholder')"
            :errorVuelidate="v$.pwd.$errors"
            v-model="pwd"
            :label="$t('update_pwd_form_newPwd_label')"
            type="password"
            autocomplete="off"
            class="mb-4"
          ></DefaultInput>
          <DefaultInput
            id="newPwdConfirm"
            :req="true"
            :showLabel="true"
            :placeholder="$t('update_pwd_form_pwdConfirm_placeholder')"
            :errorVuelidate="v$.pwdConfirm.$errors"
            v-model="pwdConfirm"
            :label="$t('update_pwd_form_pwdConfirm_label')"
            type="password"
            autocomplete="off"
            class="mb-4"
          ></DefaultInput>
        </div>
        <DefaultInput
          id="oldPwd"
          :req="true"
          :showLabel="true"
          :placeholder="$t('update_pwd_form_oldPwd_placeholder')"
          :errorVuelidate="v$.oldPwd.$errors"
          v-model="oldPwd"
          :label="$t('update_pwd_form_oldPwd_label')"
          type="password"
          class="mb-4"
          autocomplete="off"
        ></DefaultInput>
        <div class="form-error-label" v-if="errorOnSubmit">
          {{ errorOnSubmit }}
        </div>
        <button class="btn primary defaults" type="submit">
          {{ $t("update_pwd_cta") }}
        </button>
      </form>
    </DefaultModal>
  </div>
</template>
