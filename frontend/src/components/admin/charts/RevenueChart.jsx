import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber, formatPrice } from '../../../utils/format.js'
import { AXIS_TICK, CHART, compactNumber } from './chartTheme.js'
import ChartTooltip from './ChartTooltip.jsx'

const MONTH = new Intl.DateTimeFormat('fr-MA', { month: 'short', timeZone: 'UTC' })
const MONTH_YEAR = new Intl.DateTimeFormat('fr-MA', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

function monthDate(month) {
  return new Date(`${month}-01T00:00:00Z`)
}

/**
 * Revenue of the last 12 months (completed rentals, by month of return): columns
 * ≤ 24 px with a 4 px rounded top, the current month in lime. A visually hidden
 * table gives screen readers every value.
 */
export default function RevenueChart({ data }) {
  const rows = data.map((item) => ({ ...item, value: Number(item.revenue) }))
  const last = rows.length - 1

  return (
    <figure className="relative flex flex-col gap-3">
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
            barCategoryGap="25%"
          >
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickFormatter={(month) => MONTH.format(monthDate(month))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART.grid }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tickFormatter={compactNumber}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ fill: CHART.cursor }}
              content={
                <ChartTooltip
                  formatLabel={(month) => MONTH_YEAR.format(monthDate(month))}
                  formatValue={(value) => formatPrice(value)}
                  detail={(point) =>
                    `${formatNumber(point.reservations)} location${point.reservations > 1 ? 's' : ''} terminée${point.reservations > 1 ? 's' : ''}`
                  }
                />
              }
            />
            <Bar dataKey="value" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((row, index) => (
                <Cell key={row.month} fill={index === last ? CHART.emphasis : CHART.mark} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-sm text-fg-subtle">
        Le mois en cours est la dernière colonne, en vert.
      </figcaption>
      <div className="sr-only">
        <table>
          <caption>Chiffre d’affaires par mois</caption>
          <thead>
            <tr>
              <th scope="col">Mois</th>
              <th scope="col">Chiffre d’affaires</th>
              <th scope="col">Locations terminées</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">{MONTH_YEAR.format(monthDate(row.month))}</th>
                <td>{formatPrice(row.value)}</td>
                <td>{row.reservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
