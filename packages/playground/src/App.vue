<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  i18nextPromise,
  useTranslation,
  useSeo,
  useUserStore,
  useUserCheck,
} from "@fy-/fws-vue";
import { I18nBackend, getLocale } from "@fy-/fws-js";
await i18nextPromise(I18nBackend, getLocale());
const userStore = useUserStore();
const navOpen = ref(false);
const isAuth = computed(() => userStore.isAuth);
const translate = useTranslation();
const links = computed(() => {
  const _links: any[] = [{ name: translate("nav_home"), url: "/" }];
  if (!isAuth.value) {
    _links.push({
      name: translate("nav_login"),
      url: "/login",
    });
  } else {
    _links.push({
      name: translate("nav_logout"),
      action: () => {
        userStore.logout();
      },
    });
  }
  return _links;
});
useSeo(
  ref({
    name: translate("website_name"),
    type: "website",
  }),
  true,
);
if (!import.meta.env.SSR) {
  useUserCheck("/login", true);
}
</script>
<template>
  <nav
    class="flex justify-center h-20 bg-white dark:bg-fv-neutral-900 fixed w-full z-20 top-0 left-0 border-b border-fv-neutral-200 dark:border-fv-neutral-600"
  >
    <div
      class="container max-w-full xl:max-w-6xl flex flex-wrap items-center justify-between mx-auto px-4"
    >
      <a href="/" class="flex items-center">
        <img
          src="@/assets/logo.svg"
          class="h-12 mr-3"
          :alt="$t('website_name')"
        />
        <span
          class="self-center text-xl lg:text-2xl font-semibold whitespace-nowrap dark:text-white"
          >{{ $t("website_name_short") }}</span
        >
      </a>
      <div class="flex md:order-2">
        <button
          type="button"
          class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-fv-neutral-500 rounded-lg lg:hidden hover:bg-fv-neutral-100 focus:outline-none focus:ring-2 focus:ring-fv-neutral-200 dark:text-fv-neutral-400 dark:hover:bg-fv-neutral-700 dark:focus:ring-fv-neutral-600"
          aria-controls="navbar-sticky"
          aria-expanded="false"
          @click="navOpen = !navOpen"
        >
          <span class="sr-only">{{ $t("open_main_menu") }}</span>
          <svg
            class="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
      </div>
      <div
        class="nav-website"
        id="ornv"
        :class="{
          tx0: navOpen,
        }"
      >
        <ul
          itemscope
          itemtype="http://www.schema.org/SiteNavigationElement"
          class="main-nav flex flex-col w-full lg:flex-row lg:mt-0 pr-4 lg:pr-0"
        >
          <li
            v-for="(l, i) in links"
            :key="`l_${i}`"
            itemprop="name"
            class="flex-grow relative"
          >
            <RouterLink
              @click="navOpen = !navOpen"
              :to="l.url"
              v-if="l.url"
              itemprop="url"
              class="group"
              href="/"
              >{{ l.name
              }}<span class="bd group-hover:opacity-100 group-hover:w-10"></span
            ></RouterLink>
            <button v-else-if="l.action" @click="l.action" class="group">
              {{ l.name
              }}<span
                class="bd group-hover:opacity-100 group-hover:w-10"
              ></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <div class="flex flex-col min-h-[94.75vh] pt-20 w-full relative">
    <RouterView v-slot="{ Component }">
      <Suspense timeout="0">
        <template
          v-if="!$route.meta.reqLogin || ($route.meta.reqLogin && isAuth)"
        >
          <!--<DefaultLoader id="main" :show-loading-text="false" />-->
          <component :is="Component" />
        </template>

        <template #fallback>
          <div>Loading...</div>
        </template>
      </Suspense>
    </RouterView>
  </div>
  <footer class="bg-white dark:bg-fv-neutral-900 border-t">
    <div class="mx-auto w-full max-w-screen-xl p-4">
      <div class="sm:flex sm:items-center sm:justify-between">
        <span
          class="text-sm text-fv-neutral-500 sm:text-center dark:text-fv-neutral-400"
          >{{ $t("footer_copyright") }} -
          <RouterLink
            to="/pages/privacy"
            class="underline hover:no-underline"
            >{{ $t("nav_privacy") }}</RouterLink
          >
        </span>
      </div>
    </div>
  </footer>
</template>
