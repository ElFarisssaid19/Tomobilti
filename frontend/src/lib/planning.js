import { CircleCheck, Clock, Flag, KeyRound } from 'lucide-react'

/*
 * Date arithmetic of the planning timeline (/admin/planning), on "YYYY-MM-DD" strings
 * in the browser's timezone (the agency's).
 */

export const PLANNING_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

/** Local midnight of a "YYYY-MM-DD" day. */
export function dayStart(day) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

export function toDay(date) {
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(day, count) {
  const date = dayStart(day)
  date.setDate(date.getDate() + count)
  return toDay(date)
}

/** Monday of the week containing `date`. */
export function mondayOf(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return toDay(monday)
}

/** The days shown, from `from`, PLANNING_DAYS long. */
export function planningDays(from) {
  return Array.from({ length: PLANNING_DAYS }, (_, index) => addDays(from, index))
}

/**
 * Horizontal position of a period in the window, in percent of its width, clipped to
 * the window. `startsBefore` / `endsAfter` say whether it runs past an edge.
 */
export function barPosition(startAt, endAt, from, days = PLANNING_DAYS) {
  const windowStart = dayStart(from).getTime()
  const windowEnd = windowStart + days * DAY_MS
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  const left = Math.max(start, windowStart)
  const right = Math.min(end, windowEnd)

  return {
    left: ((left - windowStart) / (windowEnd - windowStart)) * 100,
    width: (Math.max(right - left, 0) / (windowEnd - windowStart)) * 100,
    startsBefore: start < windowStart,
    endsAfter: end > windowEnd,
  }
}

/** Position of "now" in the window (percent), or null when it is outside. */
export function nowPosition(from, days = PLANNING_DAYS, now = new Date()) {
  const windowStart = dayStart(from).getTime()
  const ratio = (now.getTime() - windowStart) / (days * DAY_MS)
  return ratio >= 0 && ratio <= 1 ? ratio * 100 : null
}

/* Status -> bar style + icon, the same tones as StatusBadge (never color alone). */
export const BAR_STYLE = {
  pending: { icon: Clock, className: 'border-warning/45 bg-warning/15 text-warning' },
  confirmed: { icon: CircleCheck, className: 'border-info/45 bg-info/15 text-info' },
  active: { icon: KeyRound, className: 'border-success/45 bg-success/15 text-success' },
  completed: { icon: Flag, className: 'border-line-strong bg-raised text-fg-muted' },
}
