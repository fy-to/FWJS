import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import replace from "@rollup/plugin-replace";

const replaceOptions = {
  __DATE__: new Date().toISOString(),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {},
        transformAssetUrls: {
          video: ["src", "poster"],
          source: ["src"],
          img: ["src"],
          Image: ["src"],
          Video: ["src"],
          image: ["xlink:href", "href"],
          use: ["xlink:href", "href"],
        },
      },
    }),
    // @ts-ignore
    replace(replaceOptions),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
