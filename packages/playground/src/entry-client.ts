import { initVueClient, isServerRendered } from "@fy-/fws-vue";
import { createApp } from "./main";

createApp(isServerRendered()).then(({ app, router, pinia }) => {
  router.isReady().then(async () => {
    initVueClient(router, pinia);
    app.mount("#app");
  });
});
