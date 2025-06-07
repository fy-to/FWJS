import type { User } from '@fy-/fws-types'
import type { RouteLocation } from 'vue-router'
import type { APIResult } from '../composables/rest'
import { rest } from '@fy-/fws-js'
import { defineStore } from 'pinia'
import { useServerRouter } from './serverRouter'

export interface UserStore {
  user: User | null
}

// Create a debounce mechanism for authentication checks
let refreshPromise: Promise<void> | null = null
const refreshDebounceTime = 200 // 200ms
let lastRefreshTime = 0

// Cache for API endpoints
const USER_GET_ENDPOINT = 'User:get'
const USER_LOGOUT_ENDPOINT = 'User:logout'

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
        rest(USER_GET_ENDPOINT, 'GET')
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
        const user: APIResult = await rest(USER_LOGOUT_ENDPOINT, 'POST')
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
  // Get router once instead of creating shallowRef
  const router = useServerRouter()

  // Pre-build redirect URL template
  const redirectUrl = redirectLink ? `${path}?return_to=` : path

  return (route: RouteLocation, isAuthenticated: boolean) => {
    // Early return for most common case
    if (!route.meta?.reqLogin || isAuthenticated) return false

    if (redirectLink) {
      router.status = 307
      router.push(`${redirectUrl}${route.path}`)
    }
    else {
      router.push(path)
    }
    return true
  }
}

export async function useUserCheckAsyncSimple(
  path = '/login',
  redirectLink = false,
) {
  const userStore = useUserStore()
  await userStore.refreshUser()
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route immediately
  checkUser(router.currentRoute, userStore.isAuth)

  // Setup route guard - use arrow function to always get current auth state
  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, userStore.isAuth)
    }
  })
}

export async function useUserCheckAsync(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
  await userStore.refreshUser()
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route immediately
  checkUser(router.currentRoute, userStore.isAuth)

  // Setup route guards - throttle afterEach refresh
  let afterEachTimeout: NodeJS.Timeout | null = null
  router._router.afterEach(() => {
    if (afterEachTimeout) clearTimeout(afterEachTimeout)
    afterEachTimeout = setTimeout(() => {
      userStore.refreshUser()
      afterEachTimeout = null
    }, 100)
  })

  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, userStore.isAuth)
    }
  })
}

export function useUserCheck(path = '/login', redirectLink = false) {
  const userStore = useUserStore()
  const router = useServerRouter()
  const checkUser = createUserChecker(path, redirectLink)

  // Check current route after refresh
  userStore.refreshUser().then(() => {
    if (router.currentRoute) {
      checkUser(router.currentRoute, userStore.isAuth)
    }
  })

  // Setup route guards - throttle afterEach refresh
  let afterEachTimeout: NodeJS.Timeout | null = null
  router._router.afterEach(() => {
    if (afterEachTimeout) clearTimeout(afterEachTimeout)
    afterEachTimeout = setTimeout(() => {
      userStore.refreshUser()
      afterEachTimeout = null
    }, 100)
  })

  router._router.beforeEach((to: any) => {
    if (to.fullPath !== path) {
      checkUser(to, userStore.isAuth)
    }
  })
}
