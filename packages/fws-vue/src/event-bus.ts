import { inject } from "vue";
import type { Emitter } from "mitt";

export type EventBus = Emitter<Events>;

export type Events = {
  [key: string]: any;
};
export function useEventBus() {
  const eventBus = inject<EventBus>("fws-event-bus");

  if (!eventBus) throw new Error("Did you apply app.use(fwsVue)?");

  return eventBus;
}
