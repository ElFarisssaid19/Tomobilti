import { Badge, ErrorState, LoadingRegion, QuantityStepper, Skeleton } from '../../components/ui'
import { iconFor } from '../../lib/icons.js'
import { EXTRA_PRICING, label } from '../../lib/labels.js'
import { formatPrice } from '../../utils/format.js'

/**
 * Step 2: options with a quantity stepper bounded by max_quantity, the price rule
 * (par jour / par location), and the line total from the server once chosen.
 */
export default function StepExtras({ extras, draft, update, quote }) {
  const { data, isPending, isError, error, refetch } = extras

  if (isPending) {
    return (
      <LoadingRegion label="Chargement des options…" className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-24 rounded-card" />
        ))}
      </LoadingRegion>
    )
  }

  if (isError) {
    return <ErrorState title="Impossible de charger les options" error={error} onRetry={refetch} />
  }

  const lineTotals = Object.fromEntries(
    (quote?.pricing.extras ?? []).map((line) => [line.slug, line.total]),
  )

  function setQuantity(slug, quantity) {
    update((current) => ({ extras: { ...current.extras, [slug]: quantity } }))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        Toutes les options sont facultatives. Elles sont installées avant votre arrivée.
      </p>
      <ul className="flex flex-col gap-3">
        {data.map((extra) => {
          const Icon = iconFor(extra.icon)
          const quantity = draft.extras[extra.slug] ?? 0
          return (
            <li
              key={extra.slug}
              className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 transition-colors duration-150 data-selected:border-lime/50 sm:flex-row sm:items-center"
              data-selected={quantity > 0 || undefined}
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-raised text-fg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-fg">{extra.name}</h3>
                    <Badge tone="neutral">{label(EXTRA_PRICING, extra.pricing)}</Badge>
                  </div>
                  {extra.description && (
                    <p className="text-sm text-fg-muted">{extra.description}</p>
                  )}
                  <p className="text-sm text-fg tabular-nums">
                    {formatPrice(extra.price)}
                    <span className="text-fg-muted">
                      {extra.pricing === 'per_day' ? ' par jour' : ' par location'}
                      {extra.max_quantity > 1 ? `, jusqu’à ${extra.max_quantity}` : ''}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                <QuantityStepper
                  label={extra.name}
                  value={quantity}
                  max={extra.max_quantity}
                  onChange={(next) => setQuantity(extra.slug, next)}
                />
                <p className="min-h-5 text-sm font-semibold text-accent-text tabular-nums">
                  {quantity > 0 && lineTotals[extra.slug]
                    ? `+ ${formatPrice(lineTotals[extra.slug])}`
                    : ''}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
