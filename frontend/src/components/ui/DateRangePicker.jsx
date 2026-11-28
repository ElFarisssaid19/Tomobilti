import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CalendarDays } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useId } from 'react'
import { cn } from '../../lib/cn.js'
import { rentalDays } from '../../lib/dates.js'
import { scaleIn } from '../../lib/motion.js'
import { getFieldError, toErrorMessage } from '../../lib/validation.js'
import { formatDate } from '../../utils/format.js'
import Button from './Button.jsx'
import { FieldErrorText } from './FieldErrorText.jsx'
import Skeleton from './Skeleton.jsx'

const SHORT_DATE = { day: 'numeric', month: 'short', year: 'numeric' }

/*
 * The calendar (react-day-picker and the date-fns locale) loads the first time the
 * popover opens, so the home page's search does not download it up front.
 */
const DateRangeCalendar = lazy(() => import('./DateRangeCalendar.jsx'))

/** Placeholder with the calendar's footprint while it loads (one or two months). */
function CalendarSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Chargement du calendrier…</span>
      <div className="flex gap-6">
        {[0, 1].map((month) => (
          <div
            key={month}
            className={cn('flex w-72 flex-col gap-3', month === 1 && 'hidden md:flex')}
          >
            <Skeleton className="mx-auto h-6 w-32" />
            <Skeleton className="h-64 w-full rounded-input" />
          </div>
        ))}
      </div>
      <Skeleton className="h-5 w-56" />
    </div>
  )
}

/**
 * Pick-up and return dates: a two-part trigger ("Départ" / "Retour") that opens the
 * range calendar in a popover. Same props as <DateRangeCalendar>, plus label/hint/error.
 *
 * @example
 * <DateRangePicker value={range} onChange={setRange} unavailable={bookedRanges} />
 */
export default function DateRangePicker({
  label = 'Dates de location',
  hint,
  error,
  errors,
  name,
  value,
  onChange,
  unavailable,
  numberOfMonths,
  minDays,
  maxDays,
  disabled = false,
  className,
}) {
  const id = useId()
  const message =
    toErrorMessage(error) ?? getFieldError(errors, name) ?? getFieldError(errors, `${name}.from`)
  const days = rentalDays(value)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span id={`${id}-label`} className="text-sm font-semibold text-fg">
          {label}
        </span>
      )}
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton
              disabled={disabled}
              aria-labelledby={label ? `${id}-label ${id}-value` : undefined}
              aria-describedby={
                [hint && `${id}-hint`, message && `${id}-error`].filter(Boolean).join(' ') ||
                undefined
              }
              aria-invalid={message ? true : undefined}
              className={cn(
                'grid w-full grid-cols-2 rounded-input border border-line-control bg-surface text-left transition-[border-color,box-shadow] duration-150 data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-canvas data-hover:border-fg-subtle data-open:border-lime',
                message && 'border-danger',
              )}
            >
              <span id={`${id}-value`} className="contents">
                <DatePart caption="Départ" date={value?.from} disabled={disabled} />
                <DatePart caption="Retour" date={value?.to} disabled={disabled} divider />
              </span>
            </PopoverButton>

            <AnimatePresence>
              {open && (
                <PopoverPanel
                  static
                  as={motion.div}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  anchor={{ to: 'bottom start', gap: 8, padding: 16 }}
                  // Headless UI flips the panel above the trigger when there is more room
                  // there, and caps it at the space left: only the calendar scrolls, the
                  // buttons stay visible.
                  className="z-(--z-popover) flex origin-top flex-col rounded-card-lg border border-line bg-surface shadow-pop data-[anchor^=top]:origin-bottom"
                >
                  {({ close }) => (
                    <>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-0 sm:p-5 sm:pb-0">
                        <Suspense fallback={<CalendarSkeleton />}>
                          <DateRangeCalendar
                            value={value}
                            onChange={onChange}
                            unavailable={unavailable}
                            numberOfMonths={numberOfMonths}
                            minDays={minDays}
                            maxDays={maxDays}
                          />
                        </Suspense>
                      </div>
                      <div className="mx-4 flex shrink-0 items-center justify-end gap-2 border-t border-line py-4 sm:mx-5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChange?.(undefined)}
                          disabled={!value?.from}
                        >
                          Effacer
                        </Button>
                        <Button size="sm" onClick={() => close()} disabled={!days}>
                          Valider
                        </Button>
                      </div>
                    </>
                  )}
                </PopoverPanel>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg-subtle">
          {hint}
        </p>
      )}
      {message && <FieldErrorText id={`${id}-error`}>{message}</FieldErrorText>}
    </div>
  )
}

function DatePart({ caption, date, divider = false, disabled }) {
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-3 px-4 py-2.5',
        divider && 'border-l border-line',
      )}
    >
      {!divider && (
        <CalendarDays
          className="hidden size-[1.125rem] shrink-0 text-fg-subtle sm:block"
          aria-hidden="true"
        />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-fg-subtle">{caption}</span>
        <span
          className={cn(
            'truncate text-sm font-semibold tabular-nums',
            date ? 'text-fg' : 'text-fg-subtle',
            disabled && 'text-fg-disabled',
          )}
        >
          {date ? formatDate(date, SHORT_DATE) : 'Choisir'}
        </span>
      </span>
    </span>
  )
}
