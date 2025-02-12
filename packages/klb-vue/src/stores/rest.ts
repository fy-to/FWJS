import type { APIResult } from '../composables/rest'
import { defineStore } from 'pinia'

interface SharedState {
  results: Record<number, APIResult | undefined>
}

export const useRestStore = defineStore('restStore', {
  state: (): SharedState => ({
    results: {},
  }),
  actions: {
    addResult(id: number, result: APIResult) {
      this.results[id] = result
    },
    getResult(id: number) {
      return this.results[id]
    },
    removeResult(id: number) {
      delete this.results[id]
    },
  },
})
