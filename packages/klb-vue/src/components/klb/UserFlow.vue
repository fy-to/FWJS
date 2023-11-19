<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { KlbFlowData, KlbUserFlowField } from "../../types/klb";
import { useRoute, useRouter } from "vue-router";
import { useTranslation } from "../../composables/translations";
import { useEventBus } from "../../composables/event-bus";
import { useKlbStore } from "../../stores/user";
import { useRest, APIResult } from "../../composables/rest";
import DefaultInput from "../ui/DefaultInput.vue";
import { ClientOnly } from "../ssr/ClientOnly";
const rest = useRest();
interface UserFlow extends APIResult {
  data: KlbFlowData;
}

const props = withDefaults(
  defineProps<{
    returnDefault?: string;
    forceAction?: string;
    onSuccess?: Function;
  }>(),
  {
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
const store = useKlbStore();
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

const formData = ref<Record<string, any>>({
  return_to: props.returnDefault,
  session: null,
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

  if (!formData.value.session) {
    formData.value.session = route.query.session
      ? route.query.session
      : undefined;
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
    if (response.value.data.complete == true && response.value.data.user) {
      store.setUser(response.value.data.user);
      if (props.onSuccess) {
        await props.onSuccess();
      }
      if (isExternalUrl(returnTo.value)) {
        window.location.href = returnTo.value;
      } else {
        const routeExists = router.resolve(returnTo.value);
        if (routeExists.matched.length != 0) router.push(returnTo.value);
        else window.location.href = returnTo.value;
      }
      return;
    }
    if (response.value.data.url) {
      window.location.href = response.value.data.url;
      return;
    }
    if (response.value.data.Redirect && response.value.data.complete) {
      router.push("/");
      return;
    }
    formData.value = {
      session: response.value.data.session,
    };
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
      <div class="w-full">
        <h2
          class="text-lg text-fv-neutral-700 dark:text-fv-neutral-300"
          v-if="responseMessage"
        >
          {{ responseMessage }}
        </h2>
        <template
          v-if="hasOauth && response?.data.realm_flags['oauth_first'] === true"
        >
          <div
            class="flex items-center justify-center shadow py-2 rounded bg-fv-neutral-50 dark:bg-fv-neutral-700"
          >
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
              >
                <img
                  :key="`${field.label}oauth`"
                  class="h-12 w-12 block p-2 mr-3 rounded-full border-4 shadow hover:border"
                  :alt="field.info.Name"
                  :src="field.button.logo"
                  :style="`background: ${field.button['background-color']}`"
                />
              </a>
            </template>
          </div>
          <div
            class="relative flex items-center justify-center w-full mt-4 mb-2"
          >
            <div
              class="h-px bg-neutral-300 dark:bg-neutral-600 inset-x-0 absolute"
            ></div>
            <div
              class="bg-white dark:bg-neutral-700 fws-helper-text px-4 relative"
            >
              {{ $t("or_text_label") }}
            </div>
          </div>
        </template>
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
                  field.type == 'email'
                "
              >
                <DefaultInput
                  v-if="field.name"
                  :id="field.name"
                  :label="field.label"
                  class="mt-3"
                  :placeholder="field.name == 'name' ? 'John Doe' : field.label"
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
          <template
            v-if="
              hasOauth && response?.data.realm_flags['oauth_first'] !== true
            "
          >
            <div
              class="relative flex items-center justify-center w-full mt-4 mb-2"
            >
              <div
                class="h-px bg-neutral-300 dark:bg-neutral-600 inset-x-0 absolute"
              ></div>
              <div
                class="bg-white dark:bg-neutral-700 fws-helper-text px-4 relative"
              >
                {{ $t("or_text_label") }}
              </div>
            </div>
            <div
              class="flex items-center justify-center shadow py-2 rounded bg-fv-neutral-50 dark:bg-fv-neutral-800"
            >
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
                >
                  <img
                    :key="`${field.label}oauth`"
                    class="h-12 w-12 block p-2 mr-3 rounded-full border-4 shadow hover:border"
                    :alt="field.info.Name"
                    :src="field.button.logo"
                    :style="`background: ${field.button['background-color']}`"
                  />
                </a>
              </template>
            </div>
          </template>
        </template>
      </div>
    </form>
  </ClientOnly>
</template>
