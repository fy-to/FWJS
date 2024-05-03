<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { KlbFlowData, KlbUserFlowField } from "@fy-/fws-types";
import { useRoute, useRouter } from "vue-router";
import { useTranslation } from "../../composables/translations";
import { useEventBus } from "../../composables/event-bus";
import { useUserStore } from "../../stores/user";
import { useRest, APIResult } from "../../composables/rest";
import DefaultInput from "../ui/DefaultInput.vue";
import { ClientOnly } from "../ssr/ClientOnly";
import { EnvelopeIcon } from "@heroicons/vue/24/solid";
import { useSessionStorage } from "@vueuse/core";
const rest = useRest();
interface UserFlow extends APIResult {
  data: KlbFlowData;
}
const showEmail = ref<boolean>(false);
const props = withDefaults(
  defineProps<{
    returnDefault?: string;
    forceAction?: string;
    onSuccess?: Function;
  }>(),
  {
    mode: "klb",
    returnDefault: "/",
  },
);
const isExternalUrl = (url: string) => {
  return url.startsWith("http://") || url.startsWith("https://");
};
type paramsType = {
  initial: boolean;
  oauth?: string;
};
const initial = ref<boolean>(true);
const store = useUserStore();
const route = useRoute();
const router = useRouter();
const eventBus = useEventBus();
const returnTo = ref<string>(props.returnDefault);
const responseMessage = ref<string | null>(null);
const responseError = ref<APIResult>();
const responseReq = ref<string[]>([]);
const responseFields = ref<Array<KlbUserFlowField>>([]);
const response = ref<UserFlow>();
const hasOauth = ref<boolean>(false);
const fieldsError = ref<Record<string, any>>({});
const pwdRecoverMailSent = ref<boolean>(false);
const inputs = ref<InstanceType<typeof DefaultInput>[]>([]);
const translate = useTranslation();
const session = useSessionStorage<string | null>(
  "session",
  route.query.session ? route.query.session.toString() : null,
);
const formData = ref<Record<string, any>>({
  return_to: props.returnDefault,
  session: session.value,
  action: props.forceAction ? props.forceAction : undefined,
});
const completed = ref(false);

const doTrigger = async (field: any) => {
  // eslint-disable-next-line

  const _res = await eval(
    `const _rest = rest; ${field.info.Button_Extra.trigger}`,
  );
  if (_res.ethereum) {
    formData.value.ethereum = _res.ethereum;
    responseReq.value = [];
    await userFlow();
  }
};
const userFlow = async (params: paramsType = { initial: false }) => {
  eventBus.emit("login-loading", true);
  fieldsError.value = {};
  responseError.value = undefined;
  initial.value = params.initial;
  if (params.initial === false) {
    let hasError = false;
    responseReq.value.forEach((field) => {
      if (!formData.value[field] || formData.value[field] == "") {
        fieldsError.value[field] = translate("vuelidate_validator_req");
        hasError = true;
      }
    });
    if (hasError) {
      eventBus.emit("login-loading", false);
      return;
    }
  } else {
    formData.value.initial = true;
  }
  hasOauth.value = false;

  if (params.oauth) {
    formData.value.oauth2 = params.oauth;
  }

  if (route.query.return_to && typeof route.query.return_to == "string") {
    returnTo.value = route.query.return_to
      ? route.query.return_to
      : props.returnDefault;
  }

  formData.value.return_to = returnTo.value;
  response.value = (await rest("User:flow", "POST", formData.value).catch(
    (err: APIResult) => {
      if (err.token && err.token == "invalid_request_token") {
        window.location.reload();
      }
      responseError.value = err;
      if (responseError.value.param) {
        fieldsError.value[responseError.value.param] =
          responseError.value.token;
      }
      eventBus.emit("login-loading", false);
      return;
    },
  )) as UserFlow;
  if (response.value?.result == "success") {
    if (props.onSuccess) {
      await props.onSuccess();
    }
    if (response.value.data.complete == true && response.value.data.user) {
      store.setUser(response.value.data.user);
      const actualReturnTo = response.value.data.redirect
        ? response.value.data.redirect
        : returnTo.value;
      session.value = null;
      if (isExternalUrl(actualReturnTo)) {
        window.location.href = actualReturnTo;
      } else {
        const routeExists = router.resolve(actualReturnTo);
        if (routeExists.matched.length != 0) router.push(actualReturnTo);
        else window.location.href = actualReturnTo;
      }
      return;
    }
    if (response.value.data.url) {
      window.location.href = response.value.data.url;
      return;
    }
    if (response.value.data.redirect && response.value.data.complete) {
      router.push(
        response.value.data.redirect ? response.value.data.redirect : "/",
      );
      return;
    }
    formData.value = {
      session: response.value.data.session,
    };
    session.value = response.value.data.session;
    inputs.value = [];
    responseFields.value = response.value.data.fields;
    if (response.value.data.message)
      responseMessage.value = response.value.data.message;
    responseReq.value = response.value.data.req;
    responseFields.value.forEach((field) => {
      if (field.type == "oauth2") {
        hasOauth.value = true;
      }
    });
    if (!hasOauth.value && responseFields.value.length > 0) {
      showEmail.value = true;
    }
    setTimeout(() => {
      if (inputs.value.length > 0 && inputs.value[inputs.value.length - 1])
        inputs.value[inputs.value.length - 1].focus();
    }, 300);
  } else {
    //
  }

  eventBus.emit("login-loading", false);
};

onMounted(async () => {
  await userFlow({ initial: true });
});
</script>
<template>
  <ClientOnly>
    <form
      @submit.prevent="userFlow()"
      v-if="!completed"
      class="fws-login w-full"
    >
      <!--<FyLoader id="klblogin" />-->
      <div class="w-full">
        <h2
          class="text-lg text-fv-neutral-700 dark:text-fv-neutral-300 px-2"
          v-if="responseMessage"
        >
          {{ responseMessage }}
        </h2>
        <template v-if="hasOauth && !showEmail">
          <div class="flex flex-col gap-2 px-2 justify-center py-2">
            <template v-for="field of responseFields" :key="field.id">
              <a
                @click="
                  () => {
                    if (field.info.Button_Extra?.trigger) {
                      doTrigger(field);
                    } else {
                      userFlow({ initial: true, oauth: field.id });
                    }
                  }
                "
                v-if="field.type && field.type == 'oauth2' && field.button"
                href="javascript:void(0);"
                class="flex border border-fv-neutral-300 dark:border-fv-neutral-700 shadow items-center gap-2 justify-start btn neutral defaults w-full mx-auto !font-semibold"
                :style="`background: ${
                  field.button['background-color']
                }; color: ${$getContrastingTextColor(
                  field.button['background-color'],
                )}`"
              >
                <img
                  :key="`${field.label}oauth`"
                  class="h-12 w-12 block p-2 mr-3"
                  :alt="field.info.Name"
                  :src="field.button.logo"
                />
                <div>
                  {{
                    $t("user_flow_signin_with", {
                      provider: field.name,
                    })
                  }}
                </div>
              </a>
            </template>
            <button
              type="button"
              class="flex items-center gap-2 justify-start btn neutral defaults w-full mx-auto !font-semibold"
              @click="
                () => {
                  showEmail = true;
                }
              "
            >
              <EnvelopeIcon class="h-12 w-12 block p-2 mr-3" />
              <div>
                {{
                  $t("user_flow_signin_with", {
                    provider: $t("user_flow_provider_email_cta"),
                  })
                }}
              </div>
            </button>
          </div></template
        >
        <div
          class="px-2 py-2"
          v-if="forceAction || (showEmail && initial) || !initial"
        >
          <template v-if="responseFields && responseFields.length > 0">
            <template v-for="field of responseFields" :key="field.label">
              <h3
                v-if="field.type == 'label'"
                class="pt-2 pb-1 text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
                :class="
                  field.style == 'error'
                    ? 'text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300'
                    : ''
                "
              >
                <a :href="field.link" v-if="field.link" class="fws-link mb-3">{{
                  field.label
                }}</a>
                <span class="mb-2" v-else>{{ field.label }}</span>
              </h3>

              <template v-if="field.cat == 'input'">
                <template
                  v-if="
                    field.type == 'text' ||
                    field.type == 'password' ||
                    field.type == 'email' ||
                    field.type == 'mask'
                  "
                >
                  <DefaultInput
                    v-if="field.name"
                    :id="field.name"
                    :label="field.label"
                    :mask="field.mask"
                    class="mt-3"
                    :placeholder="
                      field.name == 'name' ? 'John Doe' : field.label
                    "
                    :error="fieldsError[field.name]"
                    :type="field.type"
                    ref="inputs"
                    v-model="formData[field.name]"
                    :req="responseReq.includes(field.name)"
                  />
                </template>
              </template>
              <template v-if="field.type == 'checkbox'">
                <DefaultInput
                  v-if="field.name"
                  :id="field.name"
                  class="mt-3"
                  :label="field.label"
                  :error="fieldsError[field.name]"
                  :type="field.type"
                  v-model:checkbox-value="formData[field.name]"
                  :req="responseReq.includes(field.name)"
                  :link-icon="field.link"
                />
              </template>
            </template>
            <div
              class="text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300"
              v-if="responseError && responseError.token"
            >
              {{ $t(responseError.token) }}
            </div>
            <div v-if="responseReq.includes('password') && 0" class="reset-pwd">
              <a
                href="javascript:void(0)"
                @click="
                  () => {
                    eventBus.emit('ResetPasswordModal', true);
                    pwdRecoverMailSent = false;
                  }
                "
                >{{ $t("recover_pwd_link") }}</a
              >
            </div>
            <button class="btn primary medium mt-4">
              {{ $t("cta_login_next") }}
            </button>
          </template>
        </div>
      </div>
    </form>
  </ClientOnly>
</template>
