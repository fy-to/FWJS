<script setup lang="ts">
import { ArrowDownTrayIcon } from '@heroicons/vue/24/solid'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventBus } from '../../composables/event-bus'
import { useRest } from '../../composables/rest'
import { useKlbStore } from '../../stores/user'
import DefaultPaging from '../ui/DefaultPaging.vue'
import DefaultTable from '../ui/DefaultTable.vue'
import InnerLoader from '../ui/InnerLoader.vue'

const rest = useRest()

const store = useKlbStore()
const route = useRoute()
const isAuth = computed(() => store.isAuth)
const eventBus = useEventBus()
const billingHistory = ref<any>()
async function getPaymentHistory(page = 1) {
  if (route.query.page) page = Number.parseInt(route.query.page.toString())
  const _billingHistory = await rest<any>('Order', 'GET', {
    page_no: page,
    results_per_page: 10,
    Status: 'completed',
  }).catch(() => {})
  if (_billingHistory && _billingHistory.result === 'success') {
    billingHistory.value = _billingHistory
  }
}
watch(isAuth, async (isAuth) => {
  if (isAuth) {
    await getPaymentHistory()
  }
})
onMounted(async () => {
  if (isAuth.value) {
    await getPaymentHistory()
  }
  eventBus.on('billingHistoryGoToPage', getPaymentHistory)
})
onUnmounted(() => {
  eventBus.off('billingHistoryGoToPage', getPaymentHistory)
})
</script>

<template>
  <div class="klb-billing-history">
    <template
      v-if="
        billingHistory && billingHistory.data && billingHistory.data.length !== 0
      "
    >
      <div class="flex items-center justify-center">
        <DefaultPaging
          v-if="billingHistory.paging && billingHistory.paging.page_no"
          id="billingHistory"
          :items="billingHistory.paging"
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
        <template #Invoice_Date="{ value }">
          <span class="whitespace-nowrap">
            {{ $formatDate(value.Invoice_Date.unixms) }}
          </span>
        </template>
        <template #Paid="{ value }">
          <span class="whitespace-nowrap">
            {{ $formatDate(value.Paid.unixms) }}
          </span>
        </template>
        <template #Status="{ value }">
          <span class="billing-history-tag uppercase">{{ value.Status }}</span>
        </template>
        <template #Total_Vat="{ value }">
          <span class="billing-history-tag uppercase">{{
            value.Total_Vat.display
          }}</span>
        </template>
        <template #Actions="{ value }">
          <a
            v-if="value.Invoice_Url"
            :href="value.Invoice_Url"
            target="_blank"
            class="btn neutral defaults download-btn whitespace-nowrap"
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
          billingHistory
            && billingHistory.data
            && billingHistory.data.length === 0
        "
      >
        {{ $t("no_billing_history") }}
      </p>
      <InnerLoader v-else />
    </template>
  </div>
</template>
