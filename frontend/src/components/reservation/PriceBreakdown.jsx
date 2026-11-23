import { cn } from '../../lib/cn.js'
import { formatDays } from '../../lib/dates.js'
import { EXTRA_PRICING, label } from '../../lib/labels.js'
import { formatPrice } from '../../utils/format.js'

/**
 * Every line of a price computed by the server (`pricing` from the quote or from a
 * saved reservation): the car, each option, the one-way fee, the total, and the
 * deposit apart (never part of the total). Nothing is computed here.
 */
export default function PriceBreakdown({ pricing, showDeposit = true, className }) {
  return (
    <dl className={cn('flex flex-col gap-2.5 text-sm', className)}>
      <Line
        label={`Location, ${formatDays(pricing.days)}`}
        detail={`${formatPrice(pricing.price_per_day)} par jour`}
        amount={pricing.car_total}
      />
      {pricing.extras.map((extra) => (
        <Line
          key={extra.slug}
          label={extra.quantity > 1 ? `${extra.name} × ${extra.quantity}` : extra.name}
          detail={`${formatPrice(extra.unit_price)} ${label(EXTRA_PRICING, extra.pricing).toLowerCase()}`}
          amount={extra.total}
        />
      ))}
      {pricing.fees.map((fee) => (
        <Line key={fee.code} label={fee.label} amount={fee.amount} />
      ))}
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold text-fg">Total TTC</dt>
        <dd className="text-2xl font-bold text-fg tabular-nums">{formatPrice(pricing.total)}</dd>
      </div>
      {showDeposit && (
        <div className="flex items-baseline justify-between gap-4 text-fg-muted">
          <dt>Caution, bloquée à l’agence</dt>
          <dd className="font-semibold text-fg tabular-nums">
            {formatPrice(pricing.deposit_amount)}
          </dd>
        </div>
      )}
    </dl>
  )
}

function Line({ label: text, detail, amount }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex min-w-0 flex-col">
        <span className="text-fg">{text}</span>
        {detail && <span className="text-xs text-fg-subtle tabular-nums">{detail}</span>}
      </dt>
      <dd className="shrink-0 text-fg tabular-nums">{formatPrice(amount)}</dd>
    </div>
  )
}
