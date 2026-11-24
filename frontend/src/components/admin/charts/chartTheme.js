/*
 * Chart styling from the design tokens (CSS variables of src/index.css), so charts
 * follow the theme. Emphasis form (dataviz): every mark in the muted gray, the
 * current period in lime, the only accent. No new colors.
 */
export const CHART = {
  mark: 'var(--color-fg-subtle)',
  emphasis: 'var(--color-lime)',
  grid: 'var(--color-line)',
  axis: 'var(--color-fg-subtle)',
  surface: 'var(--color-surface)',
  cursor: 'var(--color-raised)',
}

export const AXIS_TICK = { fill: CHART.axis, fontSize: 12 }

/** Compact axis labels: 0, 500, 12 k, 1,2 M (full numbers in the tooltip and table). */
export function compactNumber(value) {
  return new Intl.NumberFormat('fr-MA', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}
