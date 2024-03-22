<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTranslation, useRest, useEventBus } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();

const maxValue = ref(0);
const rest = useRest();
const stats = ref<any>();
const getProcess = async () => {
  const data = await rest(`JS`, "GET");
  if (data && data.result == "success") {
    stats.value = data.data;
  }
};
const eventBus = useEventBus();
onMounted(async () => {
  eventBus.emit("main-loading", true);
  await getProcess();
  eventBus.emit("main-loading", false);
});
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <h1 class="text-3xl mb-6">
      JS Workers
      <small class="text-sm italic"
        >(🌐 requests, 🔻 restarts, 🐌 queue size)</small
      >
    </h1>
    <div v-for="(v, k) in stats" :key="v.Name">
      <h3 class="text-xl font-bold">{{ k }}</h3>
      <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          class="flex flex-row items-center justify-between bg-gray-100 p-3 rounded-full py-2"
          v-for="p in v"
        >
          <div class="text-sm font-bold">
            {{ p.IsReady ? "✅" : "☠️" }} {{ p.Name.replace(k, "") }}
          </div>
          <div class="text-sm">{{ p.Latency }}ms</div>
          <div class="text-sm">{{ p.RequestsHandled }} 🌐</div>
          <div class="text-sm">{{ p.Restarts }} 🔻</div>
          <div class="text-sm">{{ p.InputQueue }} 🐌</div>
        </div>
      </div>
    </div>
  </div>
</template>
