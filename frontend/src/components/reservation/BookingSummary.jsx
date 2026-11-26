import { ArrowRightLeft, Banknote } from 'lucide-react'
import { draftMoment } from '../../lib/booking.js'
import { cn } from '../../lib/cn.js'
import { formatDays } from '../../lib/dates.js'
import { formatPrice } from '../../utils/format.js'
import { Button, CarImage, Skeleton } from '../ui'
import PriceBreakdown from './PriceBreakdown.jsx'

/**
 * Live summary of the booking: the car, the chosen moments and agencies, and the
 * price exactly as the server computed it (`quote`). While a new quote loads, the
 * previous one stays visible, dimmed. Sticky beside the steps on large screens,
 * where it also holds the step's main action.
 */
export default function BookingSummary({
  car,
  draft,
  locationName,
  quote,
  quoteLoading,
  quoteError,
  actionLabel,
  onAction,
  actionLoading,
  className,
}) {
  const pricing = quote?.pricing

  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-card-lg border border-line bg-surface p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <CarImage
          car={car}
          zoom={false}
          sizes="112px"
          className="h-16 w-28 shrink-0 rounded-sm"
          placeholderClassName="p-1.5"
        />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-lg font-bold text-fg">{car.name}</p>
          <p className="text-sm text-fg-muted">
            {[car.category?.name, car.year].filter(Boolean).join(', ')}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-fg-subtle">Prise en charge</dt>
          <dd className="font-semibold text-fg tabular-nums">
            {draftMoment(draft.from, draft.pickupTime)}
          </dd>
          <dd className="text-fg-muted">{locationName(draft.pickupLocation)}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-fg-subtle">Restitution</dt>
          <dd className="font-semibold text-fg tabular-nums">
            {draftMoment(draft.to, draft.returnTime)}
          </dd>
          <dd className="text-fg-muted">{locationName(draft.returnLocation)}</dd>
        </div>
      </dl>
      {draft.pickupLocation &&
        draft.returnLocation &&
        draft.pickupLocation !== draft.returnLocation && (
          <p className="-mt-2 flex items-center gap-2 text-xs text-fg-muted">
            <ArrowRightLeft className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            Retour dans une autre agence
          </p>
        )}

      <div
        aria-live="polite"
        aria-busy={quoteLoading || undefined}
        className="border-t border-line pt-4"
      >
        {pricing ? (
          <PriceBreakdown
            pricing={pricing}
            className={cn('transition-opacity duration-150', quoteLoading && 'opacity-60')}
          />
        ) : quoteLoading ? (
          <div className="flex flex-col gap-3" aria-label="Calcul du prix…">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-8 w-1/2" />
          </div>
        ) : quoteError ? (
          <p className="text-sm text-danger">{quoteError}</p>
        ) : (
          <p className="text-sm text-fg-muted">Choisissez vos dates pour voir le prix.</p>
        )}
      </div>

      <p className="flex gap-2.5 rounded-card bg-raised/60 p-3 text-sm text-fg-muted">
        <Banknote className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        <span>Paiement à l’agence, rien en ligne.</span>
      </p>

      {onAction && (
        <Button
          size="lg"
          className="hidden w-full lg:inline-flex"
          onClick={onAction}
          loading={actionLoading}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

/**
 * Below `lg`: a floating bar with the server total and the step's main action, kept
 * above the mobile bottom nav (and near the bottom edge from `md`, where there is none).
 */
export function MobileBookingBar({ quote, quoteLoading, actionLabel, onAction, actionLoading }) {
  const pricing = quote?.pricing

  return (
    <div className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-(--z-nav) px-4 md:bottom-4 lg:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4 rounded-card-lg border border-white/10 glass p-3 pl-5 shadow-pop">
        <p
          aria-live="polite"
          className={cn(
            'flex min-w-0 flex-col transition-opacity duration-150',
            quoteLoading && 'opacity-60',
          )}
        >
          <span className="text-xs text-fg-muted">
            {pricing ? `Total, ${formatDays(pricing.days)}` : 'Total'}
          </span>
          <span className="text-xl font-bold text-fg tabular-nums">
            {pricing ? formatPrice(pricing.total) : '—'}
          </span>
        </p>
        <Button onClick={onAction} loading={actionLoading} className="shrink-0">
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
