import type { User } from '@fy-/fws-types'
import type { RouteLocation } from 'vue-router'
import type { APIResult } from '../composables/rest'
import { rest } from '@fy-/fws-js'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { useServerRouter } from './serverRouter'

export interface UserStore {
  user: User | null
}

// Create a debounce mechanism for authentication checks
let refreshPromise: Promise<void> | null = null
const refreshDebounceTime = 200 // 200ms
let lastRefreshTime = 0

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
      // Debounce refreshUser calls to prevent multiple concurrent API requests
      const now = Date.now()
      if (refreshPromise && now - lastRefreshTime < refreshDebounceTime) {
        return refreshPromise
      }

      lastRefreshTime = now
      refreshPromise = new Promise((resolve) => {
        rest('User:get', 'GET')
          .then((user: APIResult) => {
            if (user.result === 'success') {
              this.setUser(user.data)
            }
            else {
              this.setUser(null)
            }
          })
          .catch(() => {
            this.setUser(null)
          })
          .finally(() => {
            resolve()
            // Clear the promise reference after a delay
            setTimeout(() => {
              refreshPromise = null
            }, refreshDebounceTime)
          })
      })

      return refreshPromise
    },

    async logout() {
      try {
        const user: APIResult = await rest('User:logout', 'POST')
        // In all cases, we set the user to null
        this.setUser(null)
        return user.result === 'success'
      }
      catch {
        this.setUser(null)
        return false
      }
    },

    setUser(user: User | null) {
      this.user = user
    },
  },
})

// Shared implementation for route checking to avoid code duplication
function createUserChecker(path: string, redirectLink: boolean) {
  // Use shallowRef for router since it doesn't need reactivity
  const router = shallowRef(useServerRouter())

  return (route: RouteLocation, isAuthenticated: boolean) => {
    if (!route.meta.reqLogin) return false

    if (!isAuthenticated) {
      if (!redirectLink) {
        router.value.push(path)
      }
      else {
        router.value.status = 307
        router.value.push(`${path}?return_to=${route.path}`)
      }
      return true
    }
    return false
  }
}

export async function useUserCheckAsyncSimple(
  path = '/login',
  redirectLink = false,
) {
  const userStore = useUserStore()
  await userStore.refreshUser()
  const isAuth = computed(() => userStore.isAuth)
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route immediately
  checkUser(router.currentRoute, isAuth.value)

  // Setup route guard
  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, isAuth.value)
    }
  })
}

export async function useUserCheckAsync(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
  await userStore.refreshUser()
  const isAuth = computed(() => userStore.isAuth)
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route immediately
  checkUser(router.currentRoute, isAuth.value)

  // Setup route guards
  router._router.afterEach(async () => {
    await userStore.refreshUser()
  })

  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, isAuth.value)
    }
  })
}

export function useUserCheck(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
  const isAuth = computed(() => userStore.isAuth)
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route after refresh
  userStore.refreshUser().then(() => {
    if (router.currentRoute) {
      checkUser(router.currentRoute, isAuth.value)
    }
  })

  // Setup route guards
  router._router.afterEach(async () => {
    await userStore.refreshUser()
  })

  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, isAuth.value)
    }
  })
}
