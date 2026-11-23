import { Check, CircleSlash, CircleX } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { formatDate } from '../../utils/format.js'

const WHEN = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }

/**
 * The life of a reservation as a vertical sequence: request sent, confirmed, picked
 * up, returned. A cancelled or refused reservation ends with that step instead.
 * Steps not reached yet stay grey.
 */
function timelineSteps(reservation) {
  const { timeline, status } = reservation
  const steps = [{ key: 'created', label: 'Demande envoyée', at: timeline.created_at }]

  if (status === 'cancelled') {
    if (timeline.confirmed_at)
      steps.push({ key: 'confirmed', label: 'Confirmée', at: timeline.confirmed_at })
    steps.push({
      key: 'cancelled',
      label: 'Annulée',
      at: timeline.cancelled_at,
      detail: reservation.cancellation_reason,
      tone: 'ended',
    })
    return steps
  }

  if (status === 'rejected') {
    steps.push({
      key: 'rejected',
      label: 'Refusée par l’agence',
      at: timeline.rejected_at,
      detail: reservation.rejection_reason,
      tone: 'refused',
    })
    return steps
  }

  return [
    ...steps,
    { key: 'confirmed', label: 'Confirmée par l’agence', at: timeline.confirmed_at },
    { key: 'picked_up', label: 'Voiture prise en charge', at: timeline.picked_up_at },
    { key: 'returned', label: 'Voiture restituée', at: timeline.returned_at },
  ]
}

export default function ReservationTimeline({ reservation, className }) {
  const steps = timelineSteps(reservation)

  return (
    <ol className={cn('flex flex-col', className)}>
      {steps.map((step, index) => {
        const done = Boolean(step.at)
        const Icon = step.tone === 'refused' ? CircleX : step.tone === 'ended' ? CircleSlash : Check
        const isLast = index === steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-8 bottom-0 left-[0.9375rem] w-0.5 rounded-full',
                  done && steps[index + 1]?.at ? 'bg-lime/60' : 'bg-line',
                )}
              />
            )}
            <span
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-full border',
                !done && 'border-line bg-raised text-fg-subtle',
                done && !step.tone && 'border-lime bg-lime text-on-lime',
                done && step.tone === 'ended' && 'border-line-strong bg-raised text-fg',
                done && step.tone === 'refused' && 'border-danger/40 bg-danger/12 text-danger',
              )}
            >
              {done ? (
                <Icon className="size-4" aria-hidden="true" />
              ) : (
                <span className="size-2 rounded-full bg-line-strong" aria-hidden="true" />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-1">
              <p className={cn('text-sm font-semibold', done ? 'text-fg' : 'text-fg-muted')}>
                {step.label}
                <span className="sr-only">{done ? ' (fait)' : ' (à venir)'}</span>
              </p>
              {done && (
                <p className="text-sm text-fg-muted tabular-nums">{formatDate(step.at, WHEN)}</p>
              )}
              {step.detail && (
                <p className="text-sm text-fg-muted">{`«\u00a0${step.detail}\u00a0»`}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
