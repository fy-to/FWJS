<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/solid";
import { useRoute } from "vue-router";
import { useEventBus } from "../../composables/event-bus";
import DefaultPaging from "../ui/DefaultPaging.vue";
import DefaultTable from "../ui/DefaultTable.vue";
import InnerLoader from "../ui/InnerLoader.vue";
import { useKlbStore } from "../../stores/user";
import { useRest } from "../../composables/rest";
const rest = useRest();

const store = useKlbStore();
const route = useRoute();
const isAuth = computed(() => store.isAuth);
const eventBus = useEventBus();
const billingHistory = ref<any>();
const getPaymentHistory = async (page = 1) => {
  if (route.query.page) page = parseInt(route.query.page.toString());
  const _billingHistory = await rest<any>("Order", "GET", {
    page_no: page,
    results_per_page: 10,
    Status: "completed",
  }).catch(() => {});
  if (_billingHistory && _billingHistory.result == "success") {
    billingHistory.value = _billingHistory;
  }
};
watch(isAuth, async (isAuth) => {
  if (isAuth) {
    await getPaymentHistory();
  }
});
onMounted(async () => {
  if (isAuth.value) {
    await getPaymentHistory();
  }
  eventBus.on("billingHistoryGoToPage", getPaymentHistory);
});
onUnmounted(() => {
  eventBus.off("billingHistoryGoToPage", getPaymentHistory);
});
</script>

<template>
  <div class="klb-billing-history">
    <template
      v-if="
        billingHistory && billingHistory.data && billingHistory.data.length != 0
      "
    >
      <div class="flex items-center justify-center">
        <DefaultPaging
          id="billingHistory"
          :items="billingHistory.paging"
          v-if="billingHistory.paging && billingHistory.paging.page_no"
          class="billing-history-paging !justify-start my-4"
        />
      </div>
      <DefaultTable
        :headers="{
          Invoice_Number: $t('billing_history_headers_invoice_number'),
          Invoice_Date: $t('billing_history_headers_created'),
          Paid: $t('billing_history_headers_paid'),
          Status: $t('billing_history_headers_status'),
          Total_Vat: $t('billing_history_headers_price'),
          Actions: $t('billing_history_headers_actions'),
        }"
        :sortables="{}"
        :show-headers="true"
        :data="billingHistory.data"
      >
        <template v-slot:Invoice_Date="{ value }">
          <span class="whitespace-nowrap">
            {{ $formatDate(value.Invoice_Date.unixms) }}
          </span>
        </template>
        <template v-slot:Paid="{ value }">
          <span class="whitespace-nowrap">
            {{ $formatDate(value.Paid.unixms) }}
          </span>
        </template>
        <template v-slot:Status="{ value }">
          <span class="billing-history-tag uppercase">{{ value.Status }}</span>
        </template>
        <template v-slot:Total_Vat="{ value }">
          <span class="billing-history-tag uppercase">{{
            value.Total_Vat.display
          }}</span>
        </template>
        <template v-slot:Actions="{ value }">
          <a
            :href="value.Invoice_Url"
            target="_blank"
            class="btn neutral defaults download-btn whitespace-nowrap"
            v-if="value.Invoice_Url"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            {{ $t("billing_history_download_cta") }}
          </a>
        </template>
      </DefaultTable>
    </template>
    <template v-else>
      <p
        v-if="
          billingHistory &&
          billingHistory.data &&
          billingHistory.data.length == 0
        "
      >
        {{ $t("no_billing_history") }}
      </p>
      <InnerLoader v-else />
    </template>
  </div>
</template>
