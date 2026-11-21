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

export default api
