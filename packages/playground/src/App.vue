<script setup lang="ts">
import { computed, ref } from "vue";
import {
  i18nextPromise,
  useTranslation,
  useSeo,
  useUserStore,
  useUserCheck,
  DefaultLoader,
} from "@fy-/fws-vue";
import FWSLogo from "@/assets/logo.svg";
import { I18nBackend, getLocale } from "@fy-/fws-js";
import EnUSImage from "@/assets/lang/en-US.svg";
import FrFRImage from "@/assets/lang/fr-FR.svg";
await i18nextPromise(I18nBackend, getLocale());
const userStore = useUserStore();
const locale = getLocale();
const navOpen = ref(false);
const isAuth = computed(() => userStore.isAuth);
const translate = useTranslation();
const links = computed(() => {
  const _links: any[] = [
    { name: translate("nav_home"), url: "/" },
    {
      name: "SSR",
      url: "/js_workers",
    },
    {
      name: translate("nav_docs"),
      url: "/docs",
    },

  ];
  /*
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
  }*/
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
      class="container xl:max-w-6xl mx-auto px-4 flex items-center justify-between"
    >
      <a href="/" class="flex items-center">
        <img
          src="@/assets/logo.svg"
          class="h-12 mr-3"
          :alt="$t('website_name')"
        />
        <span
          class="self-center text-xl lg:text-2xl font-semibold whitespace-nowrap dark:text-white"
          >{{ $t("website_name_short")
          }}<small class="text-sm block italic -mt-1">{{
            $t("fws_slogan")
          }}</small></span
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
            class="flex-grow flex-1 relative"
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
      <div
        class="hidden lg:flex items-center justify-center gap-2 pr-4 mt-8 lg:mt-0"
      >
        <a
          :href="
            locale == 'en-US'
              ? '/l/fr-FR' + $route.path
              : '/l/en-US' + $route.path
          "
          class="group relative focus:outline-none"
        >
          <img
            :src="
              locale == 'en-US' ? FrFRImage.toString() : EnUSImage.toString()
            "
            style="filter: grayscale(90%)"
            class="text-fv-neutral-400 w-7 h-6 rounded hover:text-fv-primary-400 active:text-fv-primary-400 active:scale-110 dark:text-fv-neutral-500 transition ease-out duration-200"
          />
          <div
            class="z-50 text-sm px-2 py-1 hidden group-hover:block absolute top-0 -mt-3 md:mt-0 -translate-y-full md:translate-y-0 md:-mr-1 md:-left-3 md:-translate-x-full whitespace-nowrap bg-white dark:bg-fv-neutral-900 shadow rounded"
          >
            <span class="text-color">
              {{ locale == "en-US" ? $t("fr_FR") : $t("en_US") }}</span
            >
          </div>
        </a>
      </div>
    </div>
  </nav>
  <div class="flex flex-col min-h-[94.75vh] pt-20 w-full relative">
    <RouterView v-slot="{ Component }">
      <Suspense timeout="0">
        <template
          v-if="!$route.meta.reqLogin || ($route.meta.reqLogin && isAuth)"
        >
          <DefaultLoader
            id="main"
            :show-loading-text="false"
            :image="FWSLogo"
          />
          <component :is="Component" />
        </template>

        <template #fallback>
          <DefaultLoader
            id="tss"
            :show-loading-text="false"
            :image="FWSLogo"
            :force="true"
          />
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
            to="/pages/privacy-policy"
            class="underline hover:no-underline"
            >{{ $t("nav_privacy") }}</RouterLink
          >
        </span>

        <div
          class="text-xs italic text-fv-neutral-500 sm:text-center dark:text-fv-neutral-400"
        >
          {{ $t("footer_add2") }}
        </div>
        <div
          class="text-xs text-fv-neutral-500 sm:text-center dark:text-fv-neutral-400"
        >
          {{ $t("footer_add") }}
        </div>
      </div>
    </div>
  </footer>
</template>
