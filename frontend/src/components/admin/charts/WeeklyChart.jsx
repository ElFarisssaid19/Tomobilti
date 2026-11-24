import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../../../utils/format.js'
import { AXIS_TICK, CHART } from './chartTheme.js'
import ChartTooltip from './ChartTooltip.jsx'

const DAY = new Intl.DateTimeFormat('fr-MA', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function weekDate(week) {
  return new Date(`${week}T00:00:00Z`)
}

function plural(count) {
  return `${formatNumber(count)} réservation${count > 1 ? 's' : ''}`
}

/** Only the current week gets a dot: lime, ringed with the surface color. */
function CurrentWeekDot({ cx, cy, index, last }) {
  if (index !== last) return null
  return (
    <circle cx={cx} cy={cy} r={5} fill={CHART.emphasis} stroke={CHART.surface} strokeWidth={2} />
  )
}

/**
 * Reservations created per week over the period: a 2 px line with a 10 % wash, the
 * current week marked by a lime dot ringed with the surface color.
 */
export default function WeeklyChart({ data }) {
  const last = data.length - 1

  return (
    <figure className="relative flex flex-col gap-3">
      <div className="h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} strokeWidth={1} />
            <XAxis
              dataKey="week"
              tickFormatter={(week) => DAY.format(weekDate(week))}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART.grid }}
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              cursor={{ stroke: CHART.axis, strokeWidth: 1 }}
              content={
                <ChartTooltip
                  formatLabel={(week) => `Semaine du ${DAY.format(weekDate(week))}`}
                  formatValue={(value) => plural(value)}
                />
              }
            />
            <Area
              type="linear"
              dataKey="reservations"
              stroke={CHART.mark}
              strokeWidth={2}
              fill={CHART.mark}
              fillOpacity={0.1}
              dot={(props) => <CurrentWeekDot key={props.index} {...props} last={last} />}
              activeDot={{ r: 5, fill: CHART.emphasis, stroke: CHART.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-sm text-fg-subtle">
        La semaine en cours est le dernier point, en vert.
      </figcaption>
      <div className="sr-only">
        <table>
          <caption>Réservations créées par semaine</caption>
          <thead>
            <tr>
              <th scope="col">Semaine du</th>
              <th scope="col">Réservations</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.week}>
                <th scope="row">{DAY.format(weekDate(row.week))}</th>
                <td>{row.reservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
