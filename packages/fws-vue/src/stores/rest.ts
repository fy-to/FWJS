import { defineStore } from "pinia";
import { APIResult } from "../rest";

type SharedState = {
  results: Record<number, APIResult | undefined>;
};

export const useRestStore = defineStore({
  id: "restStore",
  state: (): SharedState => ({
    results: {},
  }),
  actions: {
    addResult(id: number, result: APIResult) {
      this.results[id] = result;
    },
    getResult(id: number) {
      return this.results[id];
    },
    removeResult(id: number) {
      delete this.results[id];
    },
  },
});
