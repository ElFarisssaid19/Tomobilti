const LOCALE = 'fr-MA'
const TIME_ZONE = 'Africa/Casablanca'
const NBSP = ' '

const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger', // 450 -> "450", 1234.5 -> "1.234,50"
})

const invoiceAmountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

/**
 * An invoice amount, always with the centimes: "1.840,00 DH". Invoices only (the
 * /admin/factures page, like the invoice PDF: FrenchFormatter::invoiceMoney); the rest
 * of the site uses formatPrice.
 * @example formatInvoiceAmount('1840.00') // "1.840,00 DH"
 */
export function formatInvoiceAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return ''
  const value = Number(amount)
  return Number.isFinite(value) ? `${invoiceAmountFormatter.format(value)}${NBSP}DH` : ''
}

/**
 * Moroccan phone number for display: "+212524000101" -> "+212 5 24 00 01 01" (the API
 * stores E.164). Other values are returned as they are. Same rule as the PDFs and emails
 * (FrenchFormatter::phone).
 */
export function formatPhone(phone) {
  const match = /^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(phone ?? '')
  return match ? `+212 ${match.slice(1).join(' ')}` : (phone ?? '')
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

const shortRelative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'short' })
const longRelative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

/**
 * How long ago, in French: "à l’instant", "il y a 5 min", "il y a 2 h", "hier",
 * "il y a 3 jours", then the date ("12 déc.") after a week.
 * @param {Date|string|number} date
 * @param {Date} [now]
 */
export function formatRelativeTime(date, now = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  const seconds = Math.round((now.getTime() - value.getTime()) / 1000)
  if (seconds < 60) return 'à l’instant'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return shortRelative.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return shortRelative.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 7) return longRelative.format(-days, 'day')
  return formatDate(value, { day: 'numeric', month: 'short' })
}
