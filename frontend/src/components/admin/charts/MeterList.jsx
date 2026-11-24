import { cn } from '../../../lib/cn.js'

/**
 * Ranked horizontal bars (dataviz "meter list"), largest first: a name, a bar on a
 * shared scale and its figure per row; the bar drops under the name when narrow.
 * One hue, so the reader compares lengths, not colors. Plain HTML: no chart library.
 *
 * `items`: [{ key, label, value, display, detail? }]
 */
export default function MeterList({
  items,
  label,
  emptyText = 'Aucune donnée sur la période.',
  className,
}) {
  if (items.length === 0) return <p className="text-sm text-fg-muted">{emptyText}</p>

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <ul aria-label={label} className={cn('flex flex-col gap-4', className)}>
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-fg">{item.label}</span>
            <span className="shrink-0 font-semibold text-fg tabular-nums">{item.display}</span>
          </div>
          <div className="h-2 rounded-full bg-raised" aria-hidden="true">
            <div
              className="h-full rounded-full bg-fg-subtle"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          {item.detail && <span className="text-xs text-fg-subtle">{item.detail}</span>}
        </li>
      ))}
    </ul>
  )
}
