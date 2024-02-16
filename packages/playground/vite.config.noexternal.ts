import config from "./vite.config";

export default Object.assign(config, {
  ssr: {
    noExternal: true,
  },
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
