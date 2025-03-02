import type { Emitter } from 'mitt'
import { inject } from 'vue'

export interface Events {
  [key: string]: any
}

// @ts-expect-error: Emitter is not exported
export function useEventBus(): Emitter<Events> {
  // @ts-expect-error: Emitter is not exported
  const eventBus = inject<Emitter<Events>>('fwsVueEventBus')

  if (!eventBus) throw new Error('Did you apply app.use(fwsVue)?')

  return eventBus
}
