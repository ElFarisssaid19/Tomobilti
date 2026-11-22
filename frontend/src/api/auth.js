import api, { getCsrfCookie } from './client.js'

/*
 * Authentication and profile endpoints (backend/routes/api.php).
 * Functions that return a user return the UserResource object (`data`).
 */

/** GET /api/user -> the signed-in user (401 for guests). */
export async function fetchCurrentUser() {
  const { data } = await api.get('/api/user')
  return data.data
}

/** POST /api/auth/login { email, password, remember } */
export async function login(credentials) {
  await getCsrfCookie()
  const { data } = await api.post('/api/auth/login', credentials)
  return data.data
}

/** POST /api/auth/register { name, email, phone, password, password_confirmation, terms } */
export async function register(payload) {
  await getCsrfCookie()
  const { data } = await api.post('/api/auth/register', payload)
  return data.data
}

/** POST /api/auth/logout */
export async function logout() {
  await api.post('/api/auth/logout')
}

/** POST /api/auth/forgot-password { email } -> { message } */
export async function requestPasswordReset(email) {
  await getCsrfCookie()
  const { data } = await api.post('/api/auth/forgot-password', { email })
  return data
}

/** POST /api/auth/reset-password { token, email, password, password_confirmation } -> { message } */
export async function resetPassword(payload) {
  await getCsrfCookie()
  const { data } = await api.post('/api/auth/reset-password', payload)
  return data
}

/**
 * POST /api/auth/email/verify/{id}/{hash}?expires&signature, with the parameters of
 * the link received by email. -> { status: 'verified' | 'already_verified', message }
 */
export async function verifyEmail({ id, hash, expires, signature }) {
  await getCsrfCookie()
  const path = `/api/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`
  const { data } = await api.post(path, null, { params: { expires, signature } })
  return data
}

/** POST /api/auth/email/verification-notification -> { status, message } */
export async function resendVerificationEmail() {
  const { data } = await api.post('/api/auth/email/verification-notification')
  return data
}

/** PUT /api/profile (any subset of the profile fields) -> { user, message } */
export async function updateProfile(fields) {
  const { data } = await api.put('/api/profile', fields)
  return { user: data.data, message: data.message }
}

/** PUT /api/profile/password { current_password, password, password_confirmation } */
export async function updatePassword(payload) {
  const { data } = await api.put('/api/profile/password', payload)
  return data
}

/** GET /api/admin/ping (admins only) -> { message, time } */
export async function pingAdmin({ signal } = {}) {
  const { data } = await api.get('/api/admin/ping', { signal })
  return data
}
