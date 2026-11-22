const LOCALE = 'fr-MA'
const TIME_ZONE = 'Africa/Casablanca'
const NBSP = ' '

const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger', // 450 -> "450", 1234.5 -> "1.234,50"
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

/**
 * Format an amount in Moroccan dirhams, with the "DH" symbol used in Morocco.
 * Accepts numbers and the decimal strings sent by the API ("250.00").
 * @example formatPrice(450) // "450 DH"
 * @example formatPrice('1234.50') // "1.234,50 DH" (separators depend on the browser's ICU data)
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined || amount === '') return ''
  const value = Number(amount)
  return Number.isFinite(value) ? `${amountFormatter.format(value)}${NBSP}DH` : ''
}

/** Format a plain number in French (thousands separators). */
export function formatNumber(value, options) {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return options
    ? new Intl.NumberFormat(LOCALE, options).format(number)
    : numberFormatter.format(number)
}

/**
 * Format a date in French, in the agency's timezone.
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} options
 * @example formatDate('2026-11-21') // "21 novembre 2026"
 */
export function formatDate(date, options = { dateStyle: 'long' }) {
  if (date === null || date === undefined || date === '') return ''
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(value)
}
