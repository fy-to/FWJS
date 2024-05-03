<script setup lang="ts">
import { useTranslation } from "../../composables/translations";
import { useEventBus } from "../../composables/event-bus";
import { useUserStore } from "../../stores/user";
import { useRest, APIResult } from "../../composables/rest";
import DefaultModal from "../ui/DefaultModal.vue";

import { ref, computed, onMounted } from "vue";
const rest = useRest();
const eventBus = useEventBus();
const userStore = useUserStore();
const isAuth = computed(() => userStore.isAuth);
const data = ref();
const providersData = ref();
const usedProviders = ref<Record<string, boolean>>({});
const props = defineProps({
  returnTo: {
    type: String,
    required: false,
    default: "/user/account?tab=user_settings",
  },
});
const returnTo = ref(props.returnTo);
if (returnTo.value == "") {
  returnTo.value = "/user/account?tab=user_settings";
}
const getOAuth2Providers = async () => {
  eventBus.emit("main-loading", true);
  const d = await rest("User/OAuth2/Providers", "GET");
  if (d && d.result == "success") {
    providersData.value = d.data;
  }
  eventBus.emit("main-loading", false);
};
const getOAuth2Redirect = async (providerUUID: string) => {
  eventBus.emit("main-loading", true);
  const d = await rest(`User/OAuth2/Provider/${providerUUID}`, "POST", {
    ReturnTo: returnTo.value,
  });
  if (d && d.result == "success") {
    window.location.href = d.data;
  }
  eventBus.emit("main-loading", false);
};
const translate = useTranslation();
const deleteOAuth2Connection = async (providerUUID: string) => {
  eventBus.emit("showConfirm", {
    title: translate("remove_provider_confirm_title"),
    desc: translate("remove_provider_confirm_desc_warning"),
    onConfirm: async () => {
      eventBus.emit("main-loading", true);
      const d = await rest(`User/OAuth2/Provider/${providerUUID}`, "DELETE");
      if (d && d.result == "success") {
        getOAuth2User();
      }
      eventBus.emit("main-loading", false);
    },
  });
};
const getOAuth2User = async () => {
  eventBus.emit("main-loading", true);
  if (!isAuth.value) {
    return;
  }
  const d = await rest("User/OAuth2", "GET");
  usedProviders.value = {};
  if (d && d.result == "success") {
    data.value = d.data;
    data.value.forEach((p: any) => {
      usedProviders.value[p.ProviderUUID] = true;
    });
  }
  eventBus.emit("main-loading", false);
};
onMounted(() => {
  getOAuth2User();
  getOAuth2Providers();
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <DefaultModal id="providers" :title="$t('providers_modal_title')">
      <template v-for="provider in providersData" :key="provider.UUID">
        <div
          class="flex items-center gap-3"
          v-if="!usedProviders[provider.UUID]"
        >
          <button
            @click="
              () => {
                getOAuth2Redirect(provider.UUID);
              }
            "
            class="flex border border-fv-neutral-300 dark:border-fv-neutral-700 shadow items-center gap-2 justify-start btn neutral defaults w-full mx-auto !font-semibold"
            :style="`background: ${
              provider.Data.Button.button['background-color']
            }; color: ${$getContrastingTextColor(
              provider.Data.Button.button['background-color'],
            )}`"
          >
            <img
              :key="`${provider.Data.Button.label}oauth`"
              class="h-12 w-12 block p-2 mr-3"
              :alt="provider.Data.Button.info.Name"
              :src="provider.Data.Button.button.logo"
            />
            <div>
              {{
                $t("user_flow_signin_with", {
                  provider: provider.Data.Button.name,
                })
              }}
            </div>
          </button>
        </div>
      </template>
    </DefaultModal>
    <h2 class="h3 flex items-center justify-between">
      <span>{{ $t("oauth2_providers_title") }}</span>
      <button
        class="btn primary medium !py-1 !px-3"
        @click="
          () => {
            $eventBus.emit('providersModal', true);
          }
        "
      >
        {{ $t("add_oauth2_con_cta") }}
      </button>
    </h2>
    <p
      class="text-red-900 dark:text-red-300 text-sm bg-red-200/[.2] dark:bg-red-900/[.2] p-2 rounded shadow"
      v-if="
        $route.query.error &&
        $route.query.error === 'user_oauth2_connection_exists'
      "
    >
      {{ $t("oauth2_error_user_oauth2_connection_exists") }}
    </p>
    <div v-if="data && data.length == 0">
      <p>{{ $t("providers_empty") }}</p>
    </div>
    <div
      v-for="provider in data"
      class="flex items-center gap-3"
      :key="provider.ProviderUUID"
    >
      <img
        :src="provider.Provider.Button.button.logo"
        class="w-14 h-14 p-1 rounded-full"
        :style="`background-color: ${provider.Provider.Button.button['background-color']}`"
      />
      <div>
        <h3 class="text-xl">
          {{ provider.Provider.Button.name }}
          <small class="text-xs">({{ provider.ServiceID }})</small>
        </h3>
        <div class="flex gap-2 mt-1">
          <button
            class="btn danger small"
            @click="
              () => {
                deleteOAuth2Connection(provider.ProviderUUID);
              }
            "
          >
            {{ $t("remove_oauth2_con_cta") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
