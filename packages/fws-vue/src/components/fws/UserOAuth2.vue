<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useTranslation } from '../../composables/translations'
import { useUserStore } from '../../stores/user'

import DefaultModal from '../ui/DefaultModal.vue'

const rest = useRest()
const eventBus = useEventBus()
const userStore = useUserStore()
const isAuth = computed(() => userStore.isAuth)
const data = ref()
const providersData = ref()
const usedProviders = ref<Record<string, boolean>>({})

// Check if there are any available providers that aren't connected yet
const hasAvailableProviders = computed(() => {
  if (!providersData.value || providersData.value.length === 0) return false
  return providersData.value.some(provider => !usedProviders.value[provider.UUID])
})
const props = defineProps({
  returnTo: {
    type: String,
    required: false,
    default: '/user/account?tab=user_settings',
  },
})
const returnTo = ref(props.returnTo)
if (returnTo.value === '') {
  returnTo.value = '/user/account?tab=user_settings'
}
async function getOAuth2Providers() {
  eventBus.emit('main-loading', true)
  const d = await rest('User/OAuth2/Providers', 'GET')
  if (d && d.result === 'success') {
    providersData.value = d.data
  }
  eventBus.emit('main-loading', false)
}
async function getOAuth2Redirect(providerUUID: string) {
  eventBus.emit('main-loading', true)
  const d = await rest(`User/OAuth2/Provider/${providerUUID}`, 'POST', {
    ReturnTo: returnTo.value,
  })
  if (d && d.result === 'success') {
    window.location.href = d.data
  }
  eventBus.emit('main-loading', false)
}
const translate = useTranslation()
async function deleteOAuth2Connection(providerUUID: string) {
  eventBus.emit('showConfirm', {
    title: translate('remove_provider_confirm_title'),
    desc: translate('remove_provider_confirm_desc_warning'),
    onConfirm: async () => {
      eventBus.emit('main-loading', true)
      const d = await rest(`User/OAuth2/Provider/${providerUUID}`, 'DELETE')
      if (d && d.result === 'success') {
        getOAuth2User()
      }
      eventBus.emit('main-loading', false)
    },
  })
}
async function getOAuth2User() {
  eventBus.emit('main-loading', true)
  if (!isAuth.value) {
    return
  }
  const d = await rest('User/OAuth2', 'GET')
  usedProviders.value = {}
  if (d && d.result === 'success') {
    data.value = d.data
    data.value.forEach((p: any) => {
      usedProviders.value[p.ProviderUUID] = true
    })
  }
  eventBus.emit('main-loading', false)
}
onMounted(() => {
  getOAuth2User()
  getOAuth2Providers()
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Provider Selection Modal -->
    <DefaultModal id="providers" :title="$t('providers_modal_title')">
      <div class="grid gap-4 p-1">
        <!-- Check if there are available providers to connect -->
        <div v-if="providersData && providersData.length > 0">
          <div v-if="!hasAvailableProviders" class="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-fv-neutral-400 dark:text-fv-neutral-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
            </svg>
            <p class="text-fv-neutral-700 dark:text-fv-neutral-300 mb-1 font-medium">
              {{ $t('account_already_connected_to_all_providers') || 'All services are connected' }}
            </p>
            <p class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400">
              {{ $t('no_more_available_providers') || 'Your account is already connected to all available services' }}
            </p>
          </div>

          <template v-for="provider in providersData" v-else :key="provider.UUID">
            <div
              v-if="!usedProviders[provider.UUID]"
              class="flex items-center"
            >
              <button
                class="flex border border-fv-neutral-300 dark:border-fv-neutral-700 rounded-lg shadow-sm hover:shadow items-center gap-2 justify-start w-full mx-auto !font-medium p-3 transition-all duration-200"
                :style="`background: ${
                  provider.Data.Button.button['background-color']
                }; color: ${$getContrastingTextColor(
                  provider.Data.Button.button['background-color'],
                )}`"
                @click="
                  () => {
                    getOAuth2Redirect(provider.UUID);
                  }
                "
              >
                <img
                  :key="`${provider.Data.Button.label}oauth`"
                  class="h-10 w-10 block p-1.5 mr-3 rounded"
                  :alt="provider.Data.Button.info.Name"
                  :src="provider.Data.Button.button.logo"
                >
                <div class="text-base">
                  {{
                    $t("user_flow_signin_with", {
                      provider: provider.Data.Button.name,
                    })
                  }}
                </div>
              </button>
            </div>
          </template>
        </div>

        <!-- Loading or no providers available -->
        <div v-else class="text-center py-4">
          <p class="text-fv-neutral-500 dark:text-fv-neutral-400">
            {{ $t('loading_providers') || 'Loading available services...' }}
          </p>
        </div>
      </div>
    </DefaultModal>

    <!-- Main Container -->
    <div class="bg-white dark:bg-fv-neutral-900 rounded-lg shadow-sm border border-fv-neutral-200 dark:border-fv-neutral-700 p-4 sm:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 sm:mb-6 pb-2 sm:pb-3 border-b border-fv-neutral-200 dark:border-fv-neutral-700">
        <h2 class="text-lg font-semibold text-fv-neutral-900 dark:text-white">
          {{ $t("oauth2_providers_title") }}
        </h2>
        <button
          class="btn primary small flex items-center gap-2"
          @click="
            () => {
              $eventBus.emit('providersModal', true);
            }
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          {{ $t("add_oauth2_con_cta") }}
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="$route.query.error && $route.query.error === 'user_oauth2_connection_exists'"
        class="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
      >
        <div class="flex items-start">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-red-700 dark:text-red-300">
            {{ $t("oauth2_error_user_oauth2_connection_exists") }}
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="data && data.length === 0"
        class="py-6 sm:py-8 px-3 sm:px-4 text-center bg-fv-neutral-50 dark:bg-fv-neutral-700/30 rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-fv-neutral-400 dark:text-fv-neutral-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <p class="text-fv-neutral-700 dark:text-fv-neutral-300">
          {{ $t("providers_empty") }}
        </p>
        <button
          class="btn primary small mt-3"
          @click="
            () => {
              $eventBus.emit('providersModal', true);
            }
          "
        >
          {{ $t("add_oauth2_con_cta") }}
        </button>
      </div>

      <!-- Connected Providers List -->
      <div v-else class="grid gap-3 sm:gap-4">
        <div
          v-for="provider in data"
          :key="provider.ProviderUUID"
          class="flex items-center p-3 sm:p-4 bg-fv-neutral-50 dark:bg-fv-neutral-700/30 rounded-lg border border-fv-neutral-200 dark:border-fv-neutral-700 transition-all duration-200 hover:shadow-sm"
        >
          <div class="flex-shrink-0 mr-4">
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center p-0.5"
              :style="`background-color: ${provider.Provider.Button.button['background-color']}`"
            >
              <img
                :src="provider.Provider.Button.button.logo"
                class="w-10 h-10 object-contain"
                :alt="provider.Provider.Button.name"
              >
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-medium text-fv-neutral-900 dark:text-white truncate">
              {{ provider.Provider.Button.name }}
            </h3>
            <p class="text-sm text-fv-neutral-500 dark:text-fv-neutral-400 truncate">
              {{ provider.ServiceID }}
            </p>
          </div>
          <div class="ml-4">
            <button
              class="btn danger small flex items-center gap-1.5"
              @click="
                () => {
                  deleteOAuth2Connection(provider.ProviderUUID);
                }
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ $t("remove_oauth2_con_cta") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
