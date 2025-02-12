<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'
import { computed, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useKlbStore } from '../../stores/user'
import DefaultInput from '../ui/DefaultInput.vue'
import DefaultModal from '../ui/DefaultModal.vue'

const rest = useRest()
withDefaults(
  defineProps<{
    showValueButton?: boolean
  }>(),
  {
    showValueButton: true,
  },
)
const eventBus = useEventBus()
const store = useKlbStore()
const isAuth = computed(() => store.isAuth)
const pwd = ref<string>()
const pwdConfirm = ref<string>()
const oldPwd = ref<string>()
const errorOnSubmit = ref<string | undefined>(undefined)
const rules = {
  oldPwd: { required },
  pwd: { required },
  pwdConfirm: { req: required, sameAs: sameAs(pwd) },
}
const v$ = useVuelidate(rules, { oldPwd, pwd, pwdConfirm })
async function changeEmail() {
  errorOnSubmit.value = undefined
  if (await v$.value.$validate()) {
    const _updateResult = await rest('User/@:setPassword', 'POST', {
      old_password: oldPwd.value,
      password: pwd.value,
    }).catch((err) => {
      errorOnSubmit.value = err.token
    })
    if (_updateResult && _updateResult.result === 'success') {
      await store.refreshUser()
      eventBus.emit('updatePasswordModal', false)
    }
  }
}
</script>

<template>
  <div v-if="isAuth">
    <DefaultModal id="updatePassword" :title="$t('update_pwd_modal_title')">
      <form @submit.prevent="changeEmail">
        <div class="klb-account-grid-inputs">
          <DefaultInput
            id="newPwd"
            v-model="pwd"
            :req="true"
            :show-label="true"
            :placeholder="$t('update_pwd_form_newPwd_placeholder')"
            :error-vuelidate="v$.pwd.$errors"
            :label="$t('update_pwd_form_newPwd_label')"
            type="password"
            autocomplete="off"
            class="mb-4"
          />
          <DefaultInput
            id="newPwdConfirm"
            v-model="pwdConfirm"
            :req="true"
            :show-label="true"
            :placeholder="$t('update_pwd_form_pwdConfirm_placeholder')"
            :error-vuelidate="v$.pwdConfirm.$errors"
            :label="$t('update_pwd_form_pwdConfirm_label')"
            type="password"
            autocomplete="off"
            class="mb-4"
          />
        </div>
        <DefaultInput
          id="oldPwd"
          v-model="oldPwd"
          :req="true"
          :show-label="true"
          :placeholder="$t('update_pwd_form_oldPwd_placeholder')"
          :error-vuelidate="v$.oldPwd.$errors"
          :label="$t('update_pwd_form_oldPwd_label')"
          type="password"
          class="mb-4"
          autocomplete="off"
        />
        <div v-if="errorOnSubmit" class="form-error-label">
          {{ errorOnSubmit }}
        </div>
        <button class="btn primary defaults" type="submit">
          {{ $t("update_pwd_cta") }}
        </button>
      </form>
    </DefaultModal>
  </div>
</template>
