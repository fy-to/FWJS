<script setup lang="ts">
import { useEventBus, useRest } from '@fy-/fws-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useBBStore } from './bbStore'

const rest = useRest()
const bbStore = useBBStore()
const stats = ref()
async function getStats() {
  stats.value = undefined
  const d = await rest('ObelixBB/UserData', 'GET')
  if (d && d.result === 'success') {
    stats.value = d.data
    bbStore.setForumsDownvotesPost(d.data.PostDownvotes)
    bbStore.setForumsUpvotesPost(d.data.PostUpvotes)
    bbStore.setForumsDownvotesComment(d.data.ReplyDownvotes)
    bbStore.setForumsUpvotesComment(d.data.ReplyUpvotes)
  }
}
const eventBus = useEventBus()
onMounted(async () => {
  await getStats()
  eventBus.on('refreshBBProfile', getStats)
})
onUnmounted(() => {
  eventBus.off('refreshBBProfile', getStats)
})
</script>

<template>
  <footer v-if="stats">
    <div class="bb-kik mt-4">
      <h4 class="h5 mx-2">
        {{ $t("bb_whos_online") }}
      </h4>
      <div class="bb-kikk">
        <p
          class="text-sm px-3"
          v-html="
            $t('bb_whos_online_desc', {
              users: stats.Stats.UsersOnline ? stats.Stats.UsersOnline : 0,
              total: stats.Stats.TotalOnline ? stats.Stats.TotalOnline : 0,
              guests: stats.Stats.GuestsOnline ? stats.Stats.GuestsOnline : 0,
            })
          "
        />
      </div>
    </div>
    <div class="bb-kik mt-4">
      <h4 class="h5 mx-2">
        {{ $t("bb_stats") }}
      </h4>
      <div class="bb-kikk">
        <p
          class="text-sm px-3"
          v-html="
            $t('bb_stats_desc', {
              boards: stats.Stats.TotalBoards ? stats.Stats.TotalBoards : 0,
              posts: stats.Stats.TotalPosts ? stats.Stats.TotalPosts : 0,
              replies: stats.Stats.TotalReplies ? stats.Stats.TotalReplies : 0,
              users: stats.Stats.TotalUsers ? stats.Stats.TotalUsers : 0,
            })
          "
        />
      </div>
    </div>
  </footer>
</template>
