import type { Router } from 'vue-router'
import { defineStore } from 'pinia'

export interface ServerRouterState {
  _router: any | null
  status: number
  redirect?: string
  results: Record<number, any | undefined>
}

export const useServerRouter = defineStore('routerStore', {

  state: () =>
    ({
      _router: null,
      status: 200,
      redirect: undefined,
      results: {},
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
      const keys = Object.keys(this.results)
      if (keys.length > 100) {
        // Remove oldest entries (first 10)
        keys.slice(0, 10).forEach((key) => {
          delete this.results[Number(key)]
        })
      }
      this.results[id] = result
    },
    hasResult(id: number) {
      return this.results[id] !== undefined
    },
    getResult(id: number) {
      return this.results[id]
    },
    removeResult(id: number) {
      delete this.results[id]
    },
  },
})
