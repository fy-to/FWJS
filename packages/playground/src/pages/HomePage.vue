<script setup lang="ts">
import { ref } from "vue";
import { useSeo, useTranslation, useRest } from "@fy-/fws-vue";
import { getLocales } from "@fy-/fws-js";
const translate = useTranslation();

const maxValue = ref(0);
const rest = useRest();
const nToMs = (value) => {
  return (value / 1000000).toFixed(2);
};
const GetMaxResponseTime = () => {
  // @ts-ignore
  return Math.max(...Object.values(stats.value.AverageResponseTime));
};

function getColorBasedOnResponse(value) {
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (value <= 150) return "bg-lime-600";
  if (value <= 400) return "bg-green-600";
  if (value <= 1000) return "bg-yellow-600";
  return "bg-red-600";
}
function getColorBasedOnUptime(value) {
  if (value >= 99.9) return "bg-lime-600";
  if (value >= 98) return "bg-green-600";
  if (value >= 95) return "bg-yellow-600";
  return "bg-red-600";
}
const stats = ref();
const thoth = ref();
const getStats = async () => {
  const data = await rest(`Stats`, "GET");
  if (data && data.result == "success") {
    stats.value = data.data;
    maxValue.value = GetMaxResponseTime();
  }
};
const getTothStats = async () => {
  const data = await rest(`Thoth`, "GET");
  if (data && data.result == "success") {
    thoth.value = data.data;
  }
};
const secondsToDaysHoursMinutesSeconds = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};
await getStats();
await getTothStats();
useSeo(
  ref({
    title: translate("title_home_page"),
    description: translate("desc_home_page"),
    alternateLocales: getLocales(),
  }),
);
</script>
<template>
  <div class="container xl:max-w-6xl mx-auto px-4 mt-8">
    <p>{{ $t("fws_desc") }}</p>
    <section class="py-10 px-3">
      <h2 class="font-bold text-2xl lg:text-3xl">
        {{ $t("avg_times_title", { max: nToMs(maxValue) }) }}
      </h2>
      <div class="text-base mb-4 italic">
        {{ $t("avg_times_legend") }}
      </div>
      <div
        v-for="(time, key) in stats.AverageResponseTime"
        :key="key"
        class="flex items-center gap-3 mb-2"
      >
        <h3
          class="font-bold whitespace-nowrap w-[170px] text-lg mb-2 uppercase"
        >
          {{ key }}
        </h3>

        <div class="flex-1 rounded-none bg-fv-neutral-700 relative noise">
          <div
            class="absolute leading-none text-sm text-white text-center inset-x-0 top-[5px] font-medium"
          >
            {{ nToMs(time) }} ms
          </div>
          <div
            :class="`${getColorBasedOnResponse(
              nToMs(time),
            )}  noise  rounded-none`"
            :style="{ width: (time / maxValue) * 100 + '%' }"
          >
            &nbsp;
          </div>
        </div>
      </div>
    </section>
    <section class="py-10 px-3">
      <h2 class="font-bold text-2xl lg:text-3xl">
        {{ $t("thoth_title") }}
      </h2>
      <div class="text-base mb-4 italic">
        {{ $t("thoth_legend") }}
      </div>
      <div class="flex flex-col">
        <div
          v-for="(t, j) in thoth"
          :key="t.key"
          class="border-l border-b border-fv-neutral-400 border-r py-2 px-3"
          :class="{
            'rounded-b-xl ': j == thoth.length - 1,
            'rounded-t-xl border-t': j == 0,
          }"
        >
          <h3
            class="font-bold text-base mb-2 uppercase flex items-center justify-between"
          >
            <span>{{ t.key }}</span>
            <span
              :class="`uppercase ${getColorBasedOnUptime(
                t.avgStats.uptimePercent,
              )} text-white px-2 py-0.5 rounded`"
              >{{ $t("operational_service") }}</span
            >
          </h3>
          <div class="flex gap-1">
            <div
              v-for="(s, i) in t.stats"
              :key="`s${i}${t.key}`"
              :class="`h-12 flex-1 ${getColorBasedOnUptime(
                t.avgStats.uptimePercent,
              )} group relative`"
            >
              <div
                class="z-50 text-sm px-2 py-1 hidden group-hover:block absolute top-0 md:mt-0 translate-y-full whitespace-nowrap bg-fv-neutral-100 dark:bg-fv-neutral-900 shadow rounded"
              >
                <b>{{ s.date }}</b>
                <br />

                <b>{{ s.uptimePercent }}%</b> uptime ({{
                  s.avgResponse.toFixed(2)
                }}ms)
              </div>
            </div>
          </div>
          <div
            class="flex items-center justify-between text-fv-neutral-500 gap-x-3 pt-2"
          >
            <div>
              {{ secondsToDaysHoursMinutesSeconds(t.avgStats.totalTime) }}
            </div>
            <div class="flex-1 h-px bg-fv-neutral-300"></div>
            <div>{{ t.avgStats.uptimePercent }}% uptime</div>
            <div class="flex-1 h-px bg-fv-neutral-300"></div>
            <div>
              {{ t.avgStats.avgResponse.toFixed(2) }}ms
              <small class="text-xs"> (avg response time)</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
