import { inject } from "vue";
import type { Emitter } from "mitt";

export type Events = {
  [key: string]: any;
};

export function useEventBus(): Emitter<Events> {
  const eventBus = inject<Emitter<Events>>("klbVueEventBus");

  if (!eventBus) throw new Error("Did you apply app.use(klbVue)?");

  return eventBus;
}
