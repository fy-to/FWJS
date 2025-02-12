import type { RouteLocation } from 'vue-router'
import type { KlbAPIResultUnknown, KlbUser } from '..'
import { rest } from '@karpeleslab/klbfw'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useServerRouter } from './serverRouter'

export interface KlbStoreState {
  user: KlbUser | null
}
export const useKlbStore = defineStore('KlbStore', {
  state: (): KlbStoreState => ({
    user: null,
  }),
  getters: {
    isAuth: (state): boolean => {
      return !(state.user === null)
    },
  },
  actions: {
    async refreshUser(params = {}) {
      const apiData: KlbAPIResultUnknown = await rest(
        'User:get',
        'GET',
        params,
      ).catch(() => {}) // @todo
      if (apiData.result === 'success' && apiData.data != null) {
        this.user = apiData.data as KlbUser
      }
      else {
        this.user = null
      }
    },
    async logout() {
      const apiData: KlbAPIResultUnknown = await rest(
        'User:logout',
        'POST',
      ).catch(() => {}) // @todo

      if (apiData.result === 'success') {
        this.setUser(null)
      }
    },
    setUser(user: KlbUser | null): void {
      this.user = user
    },
  },
})

export function useUserCheck(path = '/login', redirectLink = false) {
  const userStore = useKlbStore()
  const isAuth = computed(() => userStore.isAuth)
  const router = useServerRouter()

  const checkUser = (route: RouteLocation) => {
    if (route.meta.reqLogin) {
      if (!isAuth.value) {
        if (!redirectLink) {
          router.push(path)
        }
        else {
          router.status = 307
          // encodeURIComponent because while the documentation says fullPath is percent encoded, that is a big fat lie
          router.push(
            `${path}?return_to=${encodeURIComponent(route.fullPath)}`,
          )
        }
      }
    }
  }

  userStore.refreshUser().then(() => {
    if (router.currentRoute) {
      checkUser(router.currentRoute)
    }
  })
  router._router.afterEach(async () => {
    await userStore.refreshUser()
  })
  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to)
    }
  })
}
