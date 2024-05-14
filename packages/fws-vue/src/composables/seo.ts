// @ts-nocheck
import type { Ref } from "vue";
import { useFyHead } from "@fy-/head";
import { computed } from "vue";
import { getURL, getLocale, getPrefix } from "@fy-/fws-js";

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
  canonical?: string;
  locale?: string;
  robots?: string;
  url?: string;
  isAdult?: boolean;
  alternateLocales?: string[];
}

export const useSeo = (seo: Ref<LazyHead>, initial: boolean = false) => {
  const currentUrl = `${getURL().Scheme}://${getURL().Host}${getURL().Path}`;
  const currentLocale = seo.value.locale || getLocale();
  const actualCurrentURL = computed(() => seo.value.canonical || currentUrl);
  useFyHead({
    title: computed(() => seo.value.title),
    scripts: seo.value.scripts,
    links: computed(() => {
      const links = [];

      links.push({
        rel: "canonical",
        href: actualCurrentURL.value,
        key: "canonical",
      });

      ["prev", "next"].forEach((rel) => {
        if (seo.value[rel as keyof LazyHead]) {
          links.push({
            rel,
            href: seo.value[rel as keyof LazyHead] as string,
            key: rel,
          });
        }
      });

      seo.value.alternateLocales?.forEach((locale) => {
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

      return links;
    }),
    metas: computed(() => {
      const metas = [];

      metas.push(
        { property: "og:locale", content: currentLocale },
        { property: "og:url", content: seo.value.url || currentUrl },
        { property: "og:type", content: seo.value.type || "website" },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
      );

      if (seo.value.isAdult) {
        metas.push(
          { property: "rating", content: "adult" },
          { property: "RATING", content: "RTA-5042-1996-1400-1577-RTA" },
        );
      }

      const metaPairs = [
        ["name", "og:site_name"],
        ["title", "og:title", "twitter:title"],
        ["description", "og:description", "twitter:description", "description"],
        ["published", "article:published_time"],
        ["modified", "article:modified_time"],
        ["imageWidth", "og:image:width"],
        ["imageHeight", "og:image:height"],
        ["imageType", "og:image:type", "twitter:image:type"],
        ["image", "og:image", "twitter:image"],
      ];

      metaPairs.forEach(([seoKey, ...properties]) => {
        properties.forEach((property) => {
          if (seo.value[seoKey as keyof LazyHead]) {
            metas.push({
              property,
              content: seo.value[seoKey as keyof LazyHead] as string,
            });
          }
        });
      });

      return metas;
    }),
  });
};
