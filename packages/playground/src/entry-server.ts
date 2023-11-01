import { initVueServer } from "@fy-/fws-vue";
import { createApp } from "./main";

export async function render(callback: Function) {
  return await initVueServer(createApp, callback);
}
