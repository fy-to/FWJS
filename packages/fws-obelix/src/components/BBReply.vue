<script setup lang="ts">
import { DefaultInput, useEventBus, useRest, useUserStore } from '@fy-/fws-vue'
import useVuelidate from '@vuelidate/core'
import { maxLength, minLength, required } from '@vuelidate/validators'
import { computed, reactive } from 'vue'

const store = useUserStore()
const isAuth = computed(() => store.isAuth)
const eventBus = useEventBus()
const rest = useRest()
const props = withDefaults(
  defineProps<{
    post: any
    inReplyTo?: any
  }>(),
  {
    inReplyTo: null,
  },
)
const state = reactive({
  reply: {
    Message: '',
  },
})
const rules = {
  reply: {
    Message: { required, minLength: minLength(3), maxLength: maxLength(1000) },
  },
}
const v$ = useVuelidate(rules, state)

async function postReply() {
  if (await v$.value.reply.$validate()) {
    eventBus.emit('main-loading', true)
    const data = await rest(`ObelixBB/Reply/${props.post.Slug}`, 'POST', {
      Message: state.reply.Message,
      InReplyTo: props.inReplyTo ? Number.parseInt(props.inReplyTo) : null,
      PostId: props.post.ID,
    })
    if (data && data.result === 'success') {
      eventBus.emit('reloadBB', true)
      state.reply.Message = ''
      v$.value.reply.$reset()
    }
    eventBus.emit('main-loading', false)
  }
}
</script>

<template>
  <div
    v-if="isAuth"
    :class="`${props.inReplyTo ? 'pl-7 relative pt-0 ' : ''} pb-2`"
  >
    <template v-if="post.IsLocked">
      <div
        class="bg-fv-neutral-100 text-fv-neutral-600 dark:bg-fv-neutral-800 dark:text-fv-neutral-200 p-2 rounded-lg"
      >
        {{ $t("bb_locked_msg_info") }}
      </div>
    </template>
    <template v-else>
      <div
        v-if="props.inReplyTo"
        class="w-4 h-4 rounded-full bg-fv-neutral-600 absolute -top-1s left-0.5 z-2"
      />
      <div
        v-if="props.inReplyTo"
        class="w-[4px] bg-fv-neutral-600 top-2 bottom-2 absolute left-2 z-1"
      />
      <form @submit.prevent="postReply">
        <DefaultInput
          :id="`reply_${props.post.ID}-${
            props.inReplyTo ? props.inReplyTo.ID : ''
          }`"
          v-model="state.reply.Message"
          :error-vuelidate="v$.reply.Message.$errors"
          placeholder="What are your thoughts?"
          type="textarea"
          class="mb-2 mt-4 bti"
        />
        <button type="submit" class="btn primary small px-3 float-right">
          Reply
        </button>
        <br style="clear: both">
      </form>
    </template>
  </div>
</template>
