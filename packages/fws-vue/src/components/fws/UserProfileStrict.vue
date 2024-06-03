<script setup lang="ts">
import useVuelidate from "@vuelidate/core";
import DefaultInput from "../ui/DefaultInput.vue";
import { useUserStore } from "../../stores/user";
import { useRest } from "../../composables/rest";
import { useEventBus } from "../../composables/event-bus";
import { computed, reactive, watchEffect, ref } from "vue";
import { required, helpers } from "@vuelidate/validators";
import { useTranslation } from "../../composables/translations";

const rest = useRest();
const props = withDefaults(
  defineProps<{
    onCompleted?: (data: any) => void;
    termsText?: string;
    force18?: boolean;
  }>(),
  {
    onCompleted: () => {},
    termsText: "",
    force18: false,
  },
);
const ageValidator = (value: any) => {
  const today = new Date();
  const birthDate = new Date(value);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 18 && age <= 2020;
};
const userStore = useUserStore();
const userData = computed(() => userStore.user);
const eventBus = useEventBus();
const state = reactive({
  userData: {
    Username: userData.value?.UserProfile?.Username || "",
    Gender: userData.value?.UserProfile?.Gender || "",
    Birthdate: userData.value?.UserProfile?.Birthdate || "",
    AcceptedTerms: userData.value?.AcceptedTerms || true,
  },
});
watchEffect(() => {
  state.userData = {
    Username: userData.value?.UserProfile?.Username || "",
    Gender: userData.value?.UserProfile?.Gender || "",
    Birthdate: userData.value?.UserProfile?.Birthdate
      ? new Date(userData.value?.UserProfile?.Birthdate.unixms)
          .toISOString()
          .split("T")[0]
      : "",
    AcceptedTerms: userData.value?.AcceptedTerms || true,
  };
});
const translate = useTranslation();
const rules = {
  userData: {
    Username: {
      required: required,
    },
    Gender: {
      required: required,
    },
    Birthdate: {
      required,
      ageValidator: props.force18
        ? helpers.withMessage(
            translate("fws_under_18_error_message"),
            ageValidator,
          )
        : undefined,
    },
    AcceptedTerms: {
      required: required,
    },
  },
};
const v$ = useVuelidate(rules, state);

const patchUser = async () => {
  eventBus.emit("main-loading", true);
  if (await v$.value.userData.$validate()) {
    const data = { ...state.userData };
    const birtdate = new Date(`${data.Birthdate}T00:00:00Z`);
    const birtdateAtUnixms = birtdate.getTime();
    // @ts-ignore
    data.Birthdate = birtdateAtUnixms;
    const response = await rest("User/_ForceProfile", "PATCH", data);
    if (response && response.result == "success") {
      if (props.onCompleted) {
        props.onCompleted(response);
      }
      eventBus.emit("user:refresh", true);
    }
  }
  eventBus.emit("main-loading", false);
};
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
    <!-- @vue-skip -->
    <DefaultInput
      id="birthdateFWS"
      v-model="state.userData.Birthdate"
      class="mb-4"
      type="date"
      :label="$t('fws_birthdate_label')"
      :error-vuelidate="v$.userData.Birthdate.$errors"
    />

    <DefaultInput
      id="acceptedTermsFWS"
      v-model:checkbox-value="state.userData.AcceptedTerms"
      type="toggle"
      :label="$t('fws_accepted_terms_label')"
      :help="$t('fws_accepted_terms_help')"
      :error-vuelidate="v$.userData.AcceptedTerms.$errors"
    />
    <p class="terms-box" v-if="props.termsText">{{ props.termsText }}</p>

    <div class="flex">
      <button type="submit" class="btn defaults primary">
        {{ $t("fws_save_user_cta") }}
      </button>
    </div>
  </form>
</template>
