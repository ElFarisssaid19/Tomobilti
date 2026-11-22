/*
 * Small helpers shared by the auth pages and the route guards.
 * The server stays the source of truth: these checks only save a round trip.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOROCCAN_PHONE = /^(?:\+212|00212|212|0)[5-7]\d{8}$/

export const PASSWORD_HINT = '8 caractères minimum, avec des lettres et des chiffres.'

export function isEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? '').trim())
}

/** Same spellings as the backend accepts: 06 12 34 56 78, +212 6…, 00212 6… */
export function isMoroccanPhone(value) {
  return MOROCCAN_PHONE.test(String(value ?? '').replace(/[\s.\-()]/g, ''))
}

/** Mirrors Password::defaults() on the backend: min 8, letters and numbers. */
export function isValidPassword(value) {
  return value.length >= 8 && /\p{L}/u.test(value) && /\d/.test(value)
}

/**
 * Strength of a password for the hint under the field: 0 (empty) to 4.
 * @returns {{ score: 0|1|2|3|4, label: string }}
 */
export function passwordStrength(value = '') {
  if (!value) return { score: 0, label: '' }
  if (!isValidPassword(value)) return { score: 1, label: 'Trop faible' }

  let score = 2
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (value.length >= 12 || /[^\p{L}\d]/u.test(value)) score += 1

  return { score, label: ['', 'Trop faible', 'Correct', 'Bon', 'Excellent'][score] }
}

/**
 * Only keep internal paths from a `?redirect=` parameter (never "//evil.com" or
 * "https://…"), so the login page cannot be used as an open redirect.
 */
export function safeRedirect(value, fallback) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }
  return value
}

/** Where a user lands after logging in. */
export function homePathFor(user, redirect) {
  if (user?.is_admin) return '/admin'
  return safeRedirect(redirect, '/espace/profil')
}

/** "Salma Bennani" -> "Salma" */
export function firstName(user) {
  return user?.name?.trim().split(/\s+/)[0] ?? ''
}

/** Message of an API error that has no field errors (403, 429, network…). */
export function apiErrorMessage(
  error,
  fallback = 'Une erreur est survenue. Réessayez dans un instant.',
) {
  if (!error?.response) return 'Impossible de joindre le serveur. Vérifiez votre connexion.'
  return error.response.data?.message || fallback
}

/** True for a Laravel validation error, whose messages go next to the fields. */
export function isValidationError(error) {
  return error?.response?.status === 422
}

/** After a failed submit, move the focus to the first invalid field. */
export function focusFirstInvalid(form) {
  requestAnimationFrame(() => form?.querySelector('[aria-invalid="true"]')?.focus())
}
