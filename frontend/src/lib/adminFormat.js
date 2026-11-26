import { formatDate } from '../utils/format.js'

/* Short French date formats of the back office (agency timezone, via formatDate). */

export const SHORT_DATE_TIME = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
}
export const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }
export const TIME = { hour: '2-digit', minute: '2-digit' }

/** "10 déc., 10:00" */
export function formatShortDateTime(value) {
  return formatDate(value, SHORT_DATE_TIME)
}

/** "10:00" */
export function formatTime(value) {
  return formatDate(value, TIME)
}

/** "10 déc. 2026" */
export function formatShortDate(value) {
  return formatDate(value, SHORT_DATE)
}
