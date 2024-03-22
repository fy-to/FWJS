import { defineStore } from "pinia";
import { APIResult } from "../composables/rest";

type SharedState = {
  results: Record<number, any | undefined>;
};

export const useRestStore = defineStore({
  id: "restStore",
  state: (): SharedState => ({
    results: {},
  }),
  actions: {
    addResult(id: number, result: any) {
      this.results[id] = result;
    },
    hasResult(id: number) {
      return this.results[id] !== undefined;
    },
    getResult(id: number) {
      return this.results[id];
    },
    removeResult(id: number) {
      delete this.results[id];
    },
  },
});
