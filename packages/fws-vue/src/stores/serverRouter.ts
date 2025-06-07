import type { Router } from 'vue-router'
import { defineStore } from 'pinia'

export interface ServerRouterState {
  _router: any | null
  status: number
  redirect?: string
  results: Map<number, any>
}

export const useServerRouter = defineStore('routerStore', {

  state: () =>
    ({
      _router: null,
      status: 200,
      redirect: undefined,
      results: new Map(),
    }) as ServerRouterState,
  getters: {
    currentRoute: state => state._router?.currentRoute,
    route: state => state._router?.currentRoute,
  },
  actions: {
    setStatus(status: number) {
      this.status = status
    },
    _setRouter(_router: Router | null) {
      (this._router as unknown as Router | null) = _router
    },
    push(path: any, status = 302) {
      this.status = status
      if (status !== 302) this.redirect = path
      return this._router?.push(path)
    },
    replace(path: any, status = 302) {
      this.status = status
      if (status !== 302) this.redirect = path
      return this._router?.replace(path)
    },
    go(delta: number) {
      this._router?.go(delta)
    },
    back() {
      this._router?.go(-1)
    },
    forward() {
      this._router?.go(1)
    },
    addResult(id: number, result: any) {
      // Limit results cache size to prevent memory leaks
      if (this.results.size > 100) {
        // Remove oldest entries (first 10)
        const keysToDelete = Array.from(this.results.keys()).slice(0, 10)
        keysToDelete.forEach(key => this.results.delete(key))
      }
      this.results.set(id, result)
    },
    hasResult(id: number) {
      return this.results.has(id)
    },
    getResult(id: number) {
      return this.results.get(id)
    },
    removeResult(id: number) {
      this.results.delete(id)
    },
  },
})
