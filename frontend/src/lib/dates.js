import { differenceInCalendarDays, isValid, parseISO, startOfDay } from 'date-fns'

/** Date | ISO string | timestamp -> Date at local midnight, or undefined. */
export function toDay(value) {
  if (value === null || value === undefined || value === '') return undefined
  const date =
    value instanceof Date ? value : typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(date) ? startOfDay(date) : undefined
}

/**
 * Number of billed rental days for a range: one day per night, minimum 1.
 * The final pricing rule lives in the backend (Phase 4); this is for display.
 */
export function rentalDays(range) {
  const from = toDay(range?.from)
  const to = toDay(range?.to)
  if (!from || !to) return 0
  return Math.max(1, differenceInCalendarDays(to, from))
}

/** "1 jour", "3 jours". */
export function formatDays(count) {
  return `${count} ${count > 1 ? 'jours' : 'jour'}`
}

/** Normalise `[{ from, to }]` (Dates or ISO strings) to DayPicker date ranges. */
export function toDateRanges(ranges = []) {
  return ranges
    .map((range) => ({ from: toDay(range.from), to: toDay(range.to) }))
    .filter((range) => range.from && range.to)
}
