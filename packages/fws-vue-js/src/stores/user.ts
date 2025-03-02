import type { User } from '@fy-/fws-types'
import type { RouteLocation } from 'vue-router'
import type { APIResult } from '../composables/rest'
import { rest } from '@fy-/fws-js'
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useServerRouter } from './serverRouter'

export interface UserStore {
  user: User | null
}

export const useUserStore = defineStore('userStore', {
  state: (): UserStore => ({
    user: null,
  }),
  getters: {
    isAuth: (state): boolean => {
      return !(state.user === null)
    },
  },
  actions: {
    async refreshUser() {
      const user: APIResult = await rest('User:get', 'GET').catch(() => {
        this.setUser(null)
      })
      if (user.result === 'success') {
        this.setUser(user.data)
      }
      else {
        this.setUser(null)
      }
    },
    async logout() {
      const user: APIResult = await rest('User:logout', 'POST').catch(() => {
        this.setUser(null)
      })
      if (user.result === 'success') {
        this.setUser(null)
      }
      else {
        this.setUser(null)
      }
    },
    setUser(user: User | null) {
      this.user = user
    },
  },
})

export async function useUserCheckAsyncSimple(
  path = '/login',
  redirectLink = false,
) {
  const userStore = useUserStore()
  await userStore.refreshUser()
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
          router.push(`${path}?return_to=${route.path}`)
        }
      }
    }
  }
  checkUser(router.currentRoute)

  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to)
    }
  })
}

export async function useUserCheckAsync(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
  await userStore.refreshUser()
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
          router.push(`${path}?return_to=${route.path}`)
        }
      }
    }
  }
  checkUser(router.currentRoute)

  router._router.afterEach(async () => {
    await userStore.refreshUser()
  })
  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to)
    }
  })
}

export function useUserCheck(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
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
          router.push(`${path}?return_to=${route.path}`)
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
