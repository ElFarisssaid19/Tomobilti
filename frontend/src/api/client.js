import axios from 'axios'

/**
 * Shared axios instance for the Laravel API.
 *
 * - withCredentials: send the Laravel session cookie (Sanctum SPA auth).
 * - withXSRFToken: send the XSRF-TOKEN cookie back as the X-XSRF-TOKEN header,
 *   even though the API is on another port (another origin for axios).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/** Initialise the CSRF cookie before any state-changing request (login, register...). */
export function getCsrfCookie() {
  return api.get('/sanctum/csrf-cookie')
}

let unauthorizedHandler = null

/**
 * Called on every 401 response (session expired or logged out elsewhere).
 * AuthProvider registers a handler that only clears the user: route guards then
 * show the login page, so there is no redirect loop. Returns an unregister function.
 */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}

/**
 * - 419 (CSRF token expired, e.g. after a long idle time): fetch a new CSRF cookie
 *   and replay the request once.
 * - 401: tell AuthProvider the user is no longer signed in.
 */
api.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error

  if (response?.status === 419 && config && !config._csrfRetried) {
    config._csrfRetried = true
    await getCsrfCookie()
    return api(config)
  }

  if (response?.status === 401) unauthorizedHandler?.()

  return Promise.reject(error)
})

export default api
