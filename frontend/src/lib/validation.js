/*
 * Helpers for Laravel validation errors (HTTP 422):
 *   { "message": "...", "errors": { "email": ["Le champ adresse e-mail est obligatoire."] } }
 */

/**
 * Extract the `errors` object from whatever the caller has: an axios error, the
 * response payload `{ message, errors }`, or the `errors` object itself.
 * @returns {Record<string, string[]>}
 */
export function getValidationErrors(source) {
  if (!source || typeof source !== 'object') return {}
  const payload = source.response?.data ?? source
  if (payload.errors && typeof payload.errors === 'object') return payload.errors
  if (source.response) return {}
  return payload
}

/**
 * First error message for a field (dot notation keys like `extras.0.quantity` work
 * because Laravel already flattens them).
 * @returns {string | undefined}
 */
export function getFieldError(source, name) {
  if (!name) return undefined
  const messages = getValidationErrors(source)[name]
  if (Array.isArray(messages)) return messages[0]
  return typeof messages === 'string' ? messages : undefined
}

/** Normalise an `error` prop (string, array of strings, or nothing) to one message. */
export function toErrorMessage(error) {
  if (Array.isArray(error)) return error.find(Boolean)
  return error || undefined
}
