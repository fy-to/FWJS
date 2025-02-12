<script setup lang="ts">
import type { APIResult } from '../../composables/rest'
import type { KlbFlowData, KlbUserFlowField } from '../../types/klb'
import { EnvelopeIcon } from '@heroicons/vue/24/solid'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useTranslation } from '../../composables/translations'
import { useKlbStore } from '../../stores/user'
import { ClientOnly } from '../ssr/ClientOnly'
import DefaultInput from '../ui/DefaultInput.vue'

const rest = useRest()
interface UserFlow extends APIResult {
  data: KlbFlowData
}

const props = withDefaults(
  defineProps<{
    returnDefault?: string
    forceAction?: string
    onSuccess?: Function
  }>(),
  {
    returnDefault: '/',
  },
)
function isExternalUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://')
}
interface paramsType {
  initial: boolean
  oauth?: string
}
const shouldShowRealmStuff = computed(() => {
  const realmFlags = response.value?.data?.realm_flags
  const oauthFirst = realmFlags ? realmFlags.oauth_first === true : false

  return (
    (oauthFirst && showEmail.value)
    || !realmFlags
    || !oauthFirst
    || !hasOauth.value
  )
})
const store = useKlbStore()
const route = useRoute()
const router = useRouter()
const eventBus = useEventBus()
const returnTo = ref<string>(props.returnDefault)
const responseMessage = ref<string | null>(null)
const responseError = ref<APIResult>()
const responseReq = ref<string[]>([])
const responseFields = ref<Array<KlbUserFlowField>>([])
const response = ref<UserFlow>()
const hasOauth = ref<boolean>(false)
const fieldsError = ref<Record<string, any>>({})
const pwdRecoverMailSent = ref<boolean>(false)
const inputs = ref<InstanceType<typeof DefaultInput>[]>([])
const translate = useTranslation()
const showEmail = ref<boolean>(false)
const formData = ref<Record<string, any>>({
  return_to: props.returnDefault,
  session: null,
  action: props.forceAction ? props.forceAction : undefined,
})
const completed = ref(false)

async function doTrigger(field: any) {
  // eslint-disable-next-line no-eval
  const _res = await eval(
    `const _rest = rest; ${field.info.Button_Extra.trigger}`,
  )
  if (_res.ethereum) {
    formData.value.ethereum = _res.ethereum
    responseReq.value = []
    await userFlow()
  }
}

function getContrastingTextColor(backgroundColor: string) {
  const r = Number.parseInt(backgroundColor.substring(1, 3), 16)
  const g = Number.parseInt(backgroundColor.substring(3, 5), 16)
  const b = Number.parseInt(backgroundColor.substring(5, 7), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

async function userFlow(params: paramsType = { initial: false }) {
  eventBus.emit('login-loading', true)
  fieldsError.value = {}
  responseError.value = undefined

  if (params.initial === false) {
    let hasError = false
    responseReq.value.forEach((field) => {
      if (!formData.value[field] || formData.value[field] === '') {
        fieldsError.value[field] = translate('vuelidate_validator_req')
        hasError = true
      }
    })
    if (hasError) {
      eventBus.emit('login-loading', false)
      return
    }
  }
  hasOauth.value = false

  if (params.oauth) {
    formData.value.oauth2 = params.oauth
  }

  if (route.query.return_to && typeof route.query.return_to === 'string') {
    returnTo.value = route.query.return_to
      ? route.query.return_to
      : props.returnDefault
  }

  if (!formData.value.session) {
    formData.value.session = route.query.session
      ? route.query.session
      : undefined
  }

  formData.value.return_to = returnTo.value
  response.value = (await rest('User:flow', 'POST', formData.value).catch(
    (err: APIResult) => {
      if (err.token && err.token === 'invalid_request_token') {
        window.location.reload()
      }
      responseError.value = err
      if (responseError.value.param) {
        fieldsError.value[responseError.value.param]
          = responseError.value.token
      }
      eventBus.emit('login-loading', false)
    },
  )) as UserFlow
  if (response.value?.result === 'success') {
    if (response.value.data.complete === true && response.value.data.user) {
      if (response.value.data.Redirect && response.value.data.complete) {
        response.value.data.Redirect
          ? (window.location.href = response.value.data.Redirect)
          : router.push('/')
        return
      }
      store.setUser(response.value.data.user)
      if (props.onSuccess) {
        await props.onSuccess()
      }
      if (isExternalUrl(returnTo.value)) {
        window.location.href = returnTo.value
      }
      else {
        const routeExists = router.resolve(returnTo.value)
        if (routeExists.matched.length !== 0) router.push(returnTo.value)
        else window.location.href = returnTo.value
      }
      return
    }
    if (response.value.data.url) {
      window.location.href = response.value.data.url
      return
    }
    formData.value = {
      session: response.value.data.session,
    }
    inputs.value = []
    responseFields.value = response.value.data.fields
    if (response.value.data.message) {
      responseMessage.value = response.value.data.message
    }
    responseReq.value = response.value.data.req
    responseFields.value.forEach((field) => {
      if (field.type === 'oauth2') {
        hasOauth.value = true
      }
    })
    setTimeout(() => {
      if (inputs.value.length > 0 && inputs.value[inputs.value.length - 1]) {
        inputs.value[inputs.value.length - 1].focus()
      }
    }, 300)
  }
  else {
    //
  }

  eventBus.emit('login-loading', false)
}

onMounted(async () => {
  await userFlow({ initial: true })
})
</script>

<template>
  <ClientOnly>
    <form
      v-if="!completed"
      class="fws-login w-full"
      @submit.prevent="userFlow()"
    >
      <div class="w-full">
        <h2
          v-if="responseMessage"
          class="text-lg text-fv-neutral-700 dark:text-fv-neutral-300 text-center font-semibold"
        >
          {{ responseMessage }}
        </h2>
        <template
          v-if="
            hasOauth
              && response?.data.realm_flags
              && response?.data.realm_flags.oauth_first === true
          "
        >
          <div
            class="flex flex-col gap-2 px-2 justify-center py-2 min-w-[90vw] lg:min-w-[460px]"
          >
            <template v-for="field of responseFields" :key="field.id">
              <a
                v-if="field.type && field.type === 'oauth2' && field.button"
                href="javascript:void(0);"
                class="flex items-center gap-2 justify-start btn neutral defaults w-full mx-auto !font-semibold"
                :style="`background: ${
                  field.button['background-color']
                }; color: ${getContrastingTextColor(
                  field.button['background-color'],
                )}`"
                @click="
                  () => {
                    if (field.info.Button_Extra?.trigger) {
                      doTrigger(field);
                    }
                    else {
                      userFlow({ initial: true, oauth: field.id });
                    }
                  }
                "
              >
                <img
                  :key="`${field.label}oauth`"
                  class="h-12 w-12 block p-2 mr-3"
                  :alt="field.info.Name"
                  :src="field.button.logo"
                >
                <div>
                  {{
                    $t("user_flow_signin_with", {
                      provider: field.info.Name,
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
          </div>
        </template>
        <div
          v-if="shouldShowRealmStuff"
          :class="`
            ${shouldShowRealmStuff ? 'px-3 mx-auto' : ''}
              `"
        >
          <template v-if="responseFields && responseFields.length > 0">
            <template v-for="field of responseFields" :key="field.label">
              <h3
                v-if="field.type === 'label'"
                class="pt-2 pb-1 text-sm text-fv-neutral-500 dark:text-fv-neutral-400"
                :class="
                  field.style === 'error'
                    ? 'text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300'
                    : ''
                "
              >
                <a v-if="field.link" :href="field.link" class="fws-link mb-3">{{
                  field.label
                }}</a>
                <span v-else class="mb-2">{{ field.label }}</span>
              </h3>

              <template v-if="field.cat === 'input'">
                <template
                  v-if="
                    field.type === 'text'
                      || field.type === 'password'
                      || field.type === 'email'
                  "
                >
                  <DefaultInput
                    v-if="field.name"
                    :id="field.name"
                    ref="inputs"
                    v-model="formData[field.name]"
                    :label="field.label"
                    class="mt-3"
                    :placeholder="
                      field.name === 'name' ? 'John Doe' : field.label
                    "
                    :error="fieldsError[field.name]"
                    :type="field.type"
                    :req="responseReq.includes(field.name)"
                  />
                </template>
              </template>
              <template v-if="field.type === 'checkbox'">
                <DefaultInput
                  v-if="field.name"
                  :id="field.name"
                  v-model:checkbox-value="formData[field.name]"
                  class="mt-3"
                  :label="field.label"
                  :error="fieldsError[field.name]"
                  :type="field.type"
                  :req="responseReq.includes(field.name)"
                  :link-icon="field.link"
                />
              </template>
            </template>
            <div
              v-if="responseError && responseError.token"
              class="text-sm my-2 p-1 font-semibold text-red-800 dark:text-red-300"
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
              >{{ $t("recover_pwd_link") }}</a>
            </div>
            <button class="btn primary medium mt-4">
              {{ $t("cta_login_next") }}
            </button>
            <template
              v-if="
                hasOauth
                  && response?.data.realm_flags
                  && response?.data.realm_flags.oauth_first !== true
              "
            >
              <div
                class="relative flex items-center justify-center w-full mt-4 mb-2"
              >
                <div
                  class="h-px bg-neutral-300 dark:bg-neutral-600 inset-x-0 absolute"
                />
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
                    v-if="field.type && field.type === 'oauth2' && field.button"
                    href="javascript:void(0);"
                    @click="
                      () => {
                        if (field.info.Button_Extra?.trigger) {
                          doTrigger(field);
                        }
                        else {
                          userFlow({ initial: true, oauth: field.id });
                        }
                      }
                    "
                  >
                    <img
                      :key="`${field.label}oauth`"
                      class="h-12 w-12 block p-2 mr-3 rounded-full border-4 shadow hover:border"
                      :alt="field.info.Name"
                      :src="field.button.logo"
                      :style="`background: ${field.button['background-color']}`"
                    >
                  </a>
                </template>
              </div>
            </template>
          </template>
        </div>
      </div>
    </form>
  </ClientOnly>
</template>
