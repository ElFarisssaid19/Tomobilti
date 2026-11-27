import { useState } from 'react'
import { Link } from 'react-router'
import { formatShortDateTime } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { label, RESERVATION_STATUS } from '../../lib/labels.js'
import { BAR_STYLE, barPosition, nowPosition, planningDays, toDay } from '../../lib/planning.js'
import { formatDate } from '../../utils/format.js'
import CarStatusBadge from './CarStatusBadge.jsx'

/**
 * Timeline of the fleet: one row per car, one column per day, the reservations as
 * bars (click to open), a lime line at the current time. Scrolls sideways on small
 * screens while the car column stays put. Hover or focus shows the details in a
 * fixed-position tooltip, so the scroll container never clips it.
 */
export default function PlanningTimeline({ from, cars }) {
  const days = planningDays(from)
  const today = toDay(new Date())
  const now = nowPosition(from, days.length)
  const [hovered, setHovered] = useState(null)

  function show(reservation, event) {
    const rect = event.currentTarget.getBoundingClientRect()
    setHovered({ reservation, x: rect.left + rect.width / 2, y: rect.top })
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <div
          className="grid min-w-[52rem]"
          style={{ gridTemplateColumns: `minmax(8.5rem, 12rem) minmax(0, 1fr)` }}
          role="table"
          aria-label="Planning des voitures"
        >
          <div role="row" className="contents">
            <div
              role="columnheader"
              className="sticky left-0 z-(--z-raised) flex h-14 items-end border-b border-line bg-surface px-4 pb-2 text-xs font-semibold text-fg-subtle"
            >
              Voiture
            </div>
            <div
              role="columnheader"
              className="grid h-14 border-b border-line"
              style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            >
              {days.map((day) => (
                <div
                  key={day}
                  className={cn(
                    'flex flex-col items-center justify-end border-l border-line pb-2 text-xs',
                    day === today ? 'text-fg' : 'text-fg-subtle',
                  )}
                >
                  <span className="capitalize">
                    {formatDate(`${day}T12:00:00`, { weekday: 'short' })}
                  </span>
                  <span
                    className={cn(
                      'grid size-6 place-items-center rounded-full text-sm font-semibold tabular-nums',
                      day === today && 'bg-lime text-on-lime',
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {cars.map((car) => (
            <div role="row" key={car.id} className="contents">
              <div
                role="rowheader"
                className="sticky left-0 z-(--z-raised) flex min-h-16 flex-col justify-center gap-1 border-b border-line bg-surface px-4 py-2"
              >
                <Link
                  to={`/admin/voitures/${car.id}`}
                  className="link-underline touch-target truncate text-sm font-semibold text-fg"
                >
                  {car.name} {car.year}
                </Link>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs whitespace-nowrap text-fg-subtle tabular-nums">
                    {car.plate_number}
                  </span>
                  {car.status !== 'available' && (
                    <CarStatusBadge status={car.status} className="h-5 px-2" />
                  )}
                </span>
              </div>
              <div role="cell" className="relative min-h-16 border-b border-line">
                <div
                  className="absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                  aria-hidden="true"
                >
                  {days.map((day) => (
                    <div
                      key={day}
                      className={cn('border-l border-line', day === today && 'bg-raised/40')}
                    />
                  ))}
                </div>
                {car.reservations.map((reservation) => {
                  const position = barPosition(
                    reservation.start_at,
                    reservation.end_at,
                    from,
                    days.length,
                  )
                  const style = BAR_STYLE[reservation.status] ?? BAR_STYLE.completed
                  const Icon = style.icon
                  return (
                    <Link
                      key={reservation.reference}
                      to={`/admin/reservations/${reservation.reference}`}
                      aria-label={`${reservation.reference}, ${reservation.client}, ${label(RESERVATION_STATUS, reservation.status)}, du ${formatShortDateTime(reservation.start_at)} au ${formatShortDateTime(reservation.end_at)}`}
                      onPointerEnter={(event) => show(reservation, event)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={(event) => show(reservation, event)}
                      onBlur={() => setHovered(null)}
                      className={cn(
                        'absolute top-2 bottom-2 flex min-w-6 items-center gap-1.5 overflow-hidden border px-2 text-xs font-semibold transition-[filter] duration-150 hover:brightness-125',
                        style.className,
                        position.startsBefore ? 'rounded-l-none border-l-0' : 'rounded-l-sm',
                        position.endsAfter ? 'rounded-r-none border-r-0' : 'rounded-r-sm',
                      )}
                      style={{ left: `${position.left}%`, width: `${position.width}%` }}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{reservation.client}</span>
                    </Link>
                  )
                })}
                {now !== null && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-0.5 bg-lime"
                    style={{ left: `${now}%` }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hovered && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-(--z-popover) -translate-x-1/2 -translate-y-full rounded-sm border border-line-strong bg-raised px-3 py-2 shadow-pop"
          style={{ left: hovered.x, top: hovered.y - 8 }}
        >
          <p className="text-sm font-semibold text-fg tabular-nums">
            {hovered.reservation.reference}
          </p>
          <p className="text-sm text-fg">{hovered.reservation.client}</p>
          <p className="text-xs text-fg-muted tabular-nums">
            {formatShortDateTime(hovered.reservation.start_at)} –{' '}
            {formatShortDateTime(hovered.reservation.end_at)}
          </p>
          <p className="text-xs text-fg-muted">
            {label(RESERVATION_STATUS, hovered.reservation.status)}
          </p>
        </div>
      )}
    </div>
  )
}
