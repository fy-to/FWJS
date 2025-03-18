<script setup lang="ts">
import type { KlbFlowData, KlbUserFlowField } from '@fy-/fws-types'
import type { APIResult } from '../../composables/rest'
import { EnvelopeIcon } from '@heroicons/vue/24/solid'
import { useSessionStorage } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useTranslation } from '../../composables/translations'
import { useUserStore } from '../../stores/user'
import { ClientOnly } from '../ssr/ClientOnly'
import DefaultInput from '../ui/DefaultInput.vue'

const rest = useRest()
interface UserFlow extends APIResult {
  data: KlbFlowData
}
const showEmail = ref<boolean>(false)
const props = withDefaults(
  defineProps<{
    returnDefault?: string
    forceAction?: string
    onSuccess?: Function
  }>(),
  {
    mode: 'klb',
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
const initial = ref<boolean>(true)
const store = useUserStore()
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
const session = useSessionStorage<string | null>(
  'session',
  route.query.session ? route.query.session.toString() : null,
)
const formData = ref<Record<string, any>>({
  return_to: props.returnDefault,
  session: session.value,
  action: props.forceAction ? props.forceAction : undefined,
})
const completed = ref(false)

function autocompleteValue(fieldName: string): string | undefined {
  switch (fieldName) {
    case 'username':
      return 'username'
    case 'password':
      return 'current-password'
    case 'password2':
    case 'confirm':
      return 'new-password'
    case 'email':
      return 'email'
    case 'phone_number':
      return 'tel'
    default:
      return undefined
  }
}

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
async function userFlow(params: paramsType = { initial: false }) {
  eventBus.emit('login-loading', true)
  fieldsError.value = {}
  responseError.value = undefined
  initial.value = params.initial
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
  else {
    formData.value.initial = true
  }
  hasOauth.value = false

  if (params.oauth) {
    formData.value.oauth2 = params.oauth
  }

  if (route.query.return_to && typeof route.query.return_to == 'string') {
    returnTo.value = route.query.return_to
      ? route.query.return_to
      : props.returnDefault
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
      store.setUser(response.value.data.user)
      const actualReturnTo = response.value.data.redirect
        ? response.value.data.redirect
        : returnTo.value
      session.value = null
      if (isExternalUrl(actualReturnTo)) {
        if (props.onSuccess) {
          await props.onSuccess()
        }
        else {
          window.location.href = actualReturnTo
        }
      }
      else {
        if (props.onSuccess) {
          await props.onSuccess(actualReturnTo)
        }
        else {
          const routeExists = router.resolve(actualReturnTo)
          if (routeExists.matched.length !== 0) router.push(actualReturnTo)
          else window.location.href = actualReturnTo
        }
      }
      return
    }
    if (response.value.data.url) {
      window.location.href = response.value.data.url
      return
    }
    if (response.value.data.redirect && response.value.data.complete) {
      router.push(
        response.value.data.redirect ? response.value.data.redirect : '/',
      )
      return
    }
    formData.value = {
      ...formData.value,
      session: response.value.data.session,
    }
    delete formData.value.initial

    session.value = response.value.data.session
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
    if (!hasOauth.value && responseFields.value.length > 0) {
      showEmail.value = true
    }
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
      aria-labelledby="login-title"
      @submit.prevent="userFlow()"
    >
      <!-- Message / Header -->
      <div
        v-if="responseMessage"
        class="fws-login__header mb-4"
      >
        <h2
          id="login-title"
          class="text-lg font-medium text-fv-neutral-700 dark:text-fv-neutral-300"
        >
          {{ responseMessage }}
        </h2>
      </div>

      <!-- OAuth providers section -->
      <div v-if="hasOauth && !showEmail" class="fws-login__oauth space-y-3">
        <template v-for="field of responseFields" :key="field.id">
          <a
            v-if="field.type && field.type === 'oauth2' && field.button"
            href="javascript:void(0);"
            class="flex w-full items-center justify-start gap-3 px-4 py-2.5 rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-700
                   transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-fv-neutral-800
                   focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600"
            :style="field.button && field.button['background-color']
              ? `background: ${field.button['background-color']}; color: ${$getContrastingTextColor(field.button['background-color'])}`
              : ''"
            @click="
              () => {
                if (field.info && field.info.Button_Extra && field.info.Button_Extra.trigger) {
                  doTrigger(field);
                }
                else {
                  userFlow({ initial: true, oauth: field.id });
                }
              }
            "
          >
            <img
              v-if="field.button && field.button.logo"
              :key="`${field.label}oauth`"
              class="h-6 w-6 flex-shrink-0"
              :alt="field.info && field.info.Name ? field.info.Name : ''"
              :src="field.button.logo"
            >
            <span class="text-base font-medium">
              {{ $t("user_flow_signin_with", { provider: field.name }) }}
            </span>
          </a>
        </template>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-fv-neutral-200 dark:border-fv-neutral-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-fv-neutral-800 text-fv-neutral-500 dark:text-fv-neutral-400">
              {{ $t("user_flow_or") }}
            </span>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-start gap-3 px-4 py-2.5 rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-700
                 bg-white dark:bg-fv-neutral-700 text-fv-neutral-800 dark:text-white
                 hover:bg-fv-neutral-50 dark:hover:bg-fv-neutral-650 transition-all duration-200
                 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600"
          aria-label="Sign in with email"
          @click="showEmail = true"
        >
          <EnvelopeIcon class="h-6 w-6 text-fv-primary-500 dark:text-fv-primary-400 flex-shrink-0" />
          <span class="text-base font-medium">
            {{ $t("user_flow_signin_with", { provider: $t("user_flow_provider_email_cta") }) }}
          </span>
        </button>
      </div>

      <!-- Form fields section -->
      <div
        v-if="forceAction || (showEmail && initial) || !initial"
        class="fws-login__form space-y-4"
      >
        <template v-if="responseFields && responseFields.length > 0">
          <!-- Labels and text elements -->
          <template v-for="field of responseFields" :key="field.label">
            <div
              v-if="field.type === 'label'"
              class="mb-2"
            >
              <h3
                class="text-sm"
                :class="[
                  field.style === 'error'
                    ? 'p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium'
                    : 'text-fv-neutral-600 dark:text-fv-neutral-400',
                ]"
              >
                <a
                  v-if="field.link"
                  :href="field.link"
                  class="text-fv-primary-600 dark:text-fv-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600 rounded"
                >
                  {{ field.label }}
                </a>
                <span v-else v-html="field.label" />
              </h3>
            </div>

            <!-- Input fields -->
            <template v-if="field.cat === 'input'">
              <template
                v-if="
                  field.type === 'text'
                    || field.type === 'password'
                    || field.type === 'email'
                    || field.type === 'mask'
                    || field.type === 'tel'
                    || field.type === 'number'
                    || field.type === 'phone'
                "
              >
                <DefaultInput
                  v-if="field.name"
                  :id="field.name"
                  ref="inputs"
                  v-model="formData[field.name]"
                  :label="field.label"
                  :mask="field.mask"
                  :placeholder="
                    field.name === 'name' ? 'John Doe' : field.label
                  "
                  :error="fieldsError[field.name]"
                  :type="field.type"
                  :req="responseReq.includes(field.name)"
                  :autocomplete="autocompleteValue(field.name)"
                />
              </template>
            </template>

            <!-- Checkbox inputs -->
            <template v-if="field.type === 'checkbox'">
              <DefaultInput
                v-if="field.name"
                :id="field.name"
                v-model:checkbox-value="formData[field.name]"
                :label="field.label"
                :error="fieldsError[field.name]"
                :type="field.type"
                :req="responseReq.includes(field.name)"
                :link-icon="field.link"
              />
            </template>
          </template>

          <!-- Error message -->
          <div
            v-if="responseError && responseError.token"
            class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium"
            role="alert"
            v-html="$t(responseError.token)"
          />

          <!-- Password recovery link -->
          <div
            v-if="responseReq.includes('password') && 0"
            class="text-right my-2"
          >
            <button
              type="button"
              class="text-fv-primary-600 dark:text-fv-primary-400 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-fv-primary-500 rounded"
              @click="
                () => {
                  eventBus.emit('ResetPasswordModal', true);
                  pwdRecoverMailSent = false;
                }
              "
            >
              {{ $t("recover_pwd_link") }}
            </button>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm
                   text-white bg-fv-primary-600 hover:bg-fv-primary-700 dark:bg-fv-primary-700 dark:hover:bg-fv-primary-800
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fv-primary-500 dark:focus:ring-fv-primary-600
                   dark:focus:ring-offset-fv-neutral-800 font-medium transition-all duration-200"
            aria-label="Continue"
          >
            {{ $t("cta_login_next") }}
          </button>
        </template>
      </div>
    </form>
  </ClientOnly>
</template>

<style scoped>
.fws-login {
  @apply transition-all duration-300;
}

.fws-login__oauth a,
.fws-login__oauth button,
.fws-login__form button[type="submit"] {
  @apply transition-all duration-200;
}

@media (max-width: 640px) {
  .fws-login__oauth,
  .fws-login__form {
    @apply px-0;
  }
}
</style>
