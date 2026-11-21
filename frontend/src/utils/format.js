const LOCALE = 'fr-MA'
const TIME_ZONE = 'Africa/Casablanca'

const priceFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'MAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger', // 450 -> "450 MAD", 1234.5 -> "1.234,50 MAD"
})

/**
 * Format an amount in Moroccan dirhams.
 * @example formatPrice(450) // "450 MAD"
 * @example formatPrice(1234.5) // "1.234,50 MAD" (separators depend on the browser's ICU data)
 */
export function formatPrice(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? priceFormatter.format(value) : ''
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
