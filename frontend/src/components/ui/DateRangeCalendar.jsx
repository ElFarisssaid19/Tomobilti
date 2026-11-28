import { useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { fr } from 'react-day-picker/locale'
import { startOfToday } from 'date-fns'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import { cn } from '../../lib/cn.js'
import { formatDays, rentalDays, toDateRanges } from '../../lib/dates.js'
import { formatDate } from '../../utils/format.js'

const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }

function summary(range) {
  if (!range?.from) return 'Choisissez la date de départ.'
  if (!range.to) return 'Choisissez la date de retour.'
  return `${formatDays(rentalDays(range))}, du ${formatDate(range.from, SHORT_DATE)} au ${formatDate(range.to, SHORT_DATE)}`
}

/** Typographic apostrophe in a library label ("Aujourd’hui", "Choisir l’année"). */
function typographic(label) {
  return typeof label === 'function'
    ? (...args) => label(...args).replaceAll("'", '’')
    : label.replaceAll("'", '’')
}

/**
 * react-day-picker's French locale writes "Aujourd'hui" with a straight apostrophe in the
 * day buttons' accessible names; the app writes French with the typographic one.
 */
function typographicLocale(locale) {
  return {
    ...locale,
    labels: Object.fromEntries(
      Object.entries(locale.labels).map(([key, label]) => [key, typographic(label)]),
    ),
  }
}

const CALENDAR_LOCALE = /* @__PURE__ */ typographicLocale(fr)

/**
 * Inline range calendar: French locale, weeks start on Monday, past dates disabled,
 * `unavailable` ranges (already booked, inclusive) disabled and struck through.
 * A range can never include an unavailable day (`excludeDisabled`).
 *
 * @param {{ from?: Date, to?: Date }} value
 * @param {(range?: { from?: Date, to?: Date }) => void} onChange
 * @param {Array<{ from: Date|string, to: Date|string }>} unavailable
 */
export default function DateRangeCalendar({
  value,
  onChange,
  unavailable = [],
  numberOfMonths,
  minDays = 1,
  maxDays,
  showSummary = true,
  className,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const reduceMotion = useReducedMotion()
  const today = startOfToday()
  const blocked = useMemo(() => toDateRanges(unavailable), [unavailable])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <DayPicker
        mode="range"
        locale={CALENDAR_LOCALE}
        weekStartsOn={1}
        selected={value}
        onSelect={onChange}
        min={minDays}
        max={maxDays}
        excludeDisabled
        disabled={[{ before: today }, ...blocked]}
        modifiers={{ unavailable: blocked }}
        modifiersClassNames={{ unavailable: 'rdp-unavailable' }}
        numberOfMonths={numberOfMonths ?? (isDesktop ? 2 : 1)}
        startMonth={today}
        defaultMonth={value?.from ?? today}
        animate={!reduceMotion}
        className="tmb-calendar"
      />
      {showSummary && (
        <p
          aria-live="polite"
          className={cn(
            'text-sm tabular-nums',
            value?.to ? 'font-semibold text-fg' : 'text-fg-muted',
          )}
        >
          {summary(value)}
        </p>
      )}
    </div>
  )
}
