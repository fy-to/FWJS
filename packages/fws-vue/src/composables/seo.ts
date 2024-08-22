// @ts-nocheck
import type { Ref } from "vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { getURL, getLocale, getPrefix } from "@fy-/fws-js";
import { useRoute } from "vue-router";

export interface LazyHead {
  name?: string;
  title?: string;
  image?: string;
  imageType?: string;
  imageWidth?: string;
  imageHeight?: string;
  description?: string;
  published?: string;
  modified?: string;
  keywords?: string;
  type?: "blog" | "search" | "article" | "website";
  searchAction?: string;
  next?: string;
  prev?: string;
  locale?: string;
  robots?: string;
  url?: string;
  canonical?: string;
  isAdult?: boolean;
  alternateLocales?: string[];
  twitterCreator?: string;
}

export const useSeo = (seoData: Ref<LazyHead>, initial: boolean = false) => {
  const route = useRoute();
  const currentLocale = getLocale();
  const url = getURL();

  useHead({
    meta: () => {
      const metas: any[] = [];
      if (seoData.value.isAdult) {
        metas.push({
          name: "rating",
          content: "RTA-5042-1996-1400-1577-RTA",
          key: "rating",
        });
      }

      return metas;
    },
    link: () => {
      const links: any[] = [];

      links.push({
        rel: "canonical",
        href: `${url.Scheme}://${url.Host}${route.fullPath}`,
        key: "canonical",
      });

      seoData.value.alternateLocales?.forEach((locale) => {
        if (locale !== currentLocale) {
          links.push({
            rel: "alternate",
            hreflang: locale,
            href: `${getURL().Scheme}://${
              getURL().Host
            }/l/${locale}${getURL().Path.replace(getPrefix(), "")}`,
            key: `alternate-${locale}`,
          });
        }
      });

      if (seoData.value.image) {
        links.push({
          rel: "preload",
          href: seoData.value.image,
          as: "image",
          fetchpriority: "high",
        });
      }

      return links;
    },
  });

  useSeoMeta({
    ogUrl: () => `${getURL().Scheme}://${getURL().Host}${route.fullPath}`,
    ogLocale: () => {
      if (currentLocale) {
        return currentLocale.replace("-", "_");
      }
    },
    robots:
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    title: () => seoData.value.title,
    ogTitle: () => seoData.value.title,
    ogDescription: () => seoData.value.description,
    twitterCard: "summary_large_image",
    ogSiteName: () => seoData.value.name,
    twitterTitle: () => seoData.value.title,
    twitterDescription: () => seoData.value.description,
    ogImageAlt: () => {
      if (seoData.value.image) {
        return seoData.value.title;
      }
      return undefined;
    },
    ogType: () => (seoData.value.type ? seoData.value.type : "website"),
    twitterCreator: () => seoData.value.twitterCreator,
    twitterSite: () => seoData.value.twitterCreator,
    twitterImageAlt: () => {
      if (seoData.value.image) {
        return seoData.value.title;
      }
      return undefined;
    },
    description: () => seoData.value.description,
    keywords: () => seoData.value.keywords,
    articlePublishedTime: () => seoData.value.published,
    articleModifiedTime: () => seoData.value.modified,
    ogImageSecureUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes("?vars=")) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              "?vars=",
              `.${seoData.value.imageType.replace("image/", "")}?vars=`,
            );
          } else {
            return seoData.value.image.replace("?vars=", ".png?vars=");
          }
        }
        return seoData.value.image;
      }
    },
    ogImageUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes("?vars=")) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              "?vars=",
              `.${seoData.value.imageType.replace("image/", "")}?vars=`,
            );
          } else {
            return seoData.value.image.replace("?vars=", ".png?vars=");
          }
        }
        return seoData.value.image;
      }
    },
    ogImageType: () => {
      if (seoData.value.imageType) {
        return seoData.value.imageType
          ? seoData.value.imageType.includes("image/")
            ? seoData.value.imageType
            : `image/${seoData.value.imageType}`
          : "image/png";
      }
      return undefined;
    },
    twitterImageUrl: () => {
      if (seoData.value.image) {
        if (seoData.value.image.includes("?vars=")) {
          if (seoData.value.imageType) {
            return seoData.value.image.replace(
              "?vars=",
              `.${seoData.value.imageType.replace("image/", "")}?vars=`,
            );
          } else {
            return seoData.value.image.replace("?vars=", ".png?vars=");
          }
        }
        return seoData.value.image;
      }
    },
    twitterImageType() {
      if (seoData.value.imageType) {
        return seoData.value.imageType
          ? seoData.value.imageType.includes("image/")
            ? seoData.value.imageType
            : `image/${seoData.value.imageType}`
          : "image/png";
      }
      return undefined;
    },
  });
};
