/**
 * Tooltip content for Recharts, in the UI's popover style: the period in muted text,
 * the value in primary text (text never wears the series color).
 */
export default function ChartTooltip({ active, payload, label, formatLabel, formatValue, detail }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div className="rounded-sm border border-line-strong bg-raised px-3 py-2 shadow-pop">
      <p className="text-xs text-fg-muted">{formatLabel ? formatLabel(label, point) : label}</p>
      <p className="text-sm font-semibold text-fg tabular-nums">
        {formatValue(payload[0].value, point)}
      </p>
      {detail && <p className="text-xs text-fg-subtle tabular-nums">{detail(point)}</p>}
    </div>
  )
}
