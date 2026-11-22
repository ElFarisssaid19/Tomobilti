import { TrendingDown, TrendingUp } from 'lucide-react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn.js'
import { duration, ease } from '../../lib/motion.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

const FORMATTERS = {
  number: (value) => formatNumber(Math.round(value)),
  price: (value) => formatPrice(Math.round(value)),
  percent: (value) => `${formatNumber(Math.round(value))} %`,
}

/**
 * Number that counts up from 0 the first time it scrolls into view (400ms). The
 * final value is what screen readers get; reduced motion shows it directly.
 */
export function CountUp({ value, format = 'number', className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()
  const toText = FORMATTERS[format] ?? FORMATTERS.number
  const count = useMotionValue(reduceMotion ? value : 0)
  const text = useTransform(count, toText)

  useEffect(() => {
    if (!inView) return undefined
    if (reduceMotion) {
      count.set(value)
      return undefined
    }
    const controls = animate(count, value, { duration: duration.slow, ease: ease.out })
    return () => controls.stop()
  }, [count, inView, reduceMotion, value])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <span className="sr-only">{toText(value)}</span>
      <motion.span aria-hidden="true">{text}</motion.span>
    </span>
  )
}

/**
 * Admin metric: icon, label, animated value and an optional trend.
 * @example <StatCard icon={CalendarCheck} label="Réservations ce mois" value={128} trend={{ value: 12, label: 'vs octobre' }} />
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  format = 'number',
  trend,
  className,
}) {
  const up = trend && trend.value >= 0
  const TrendIcon = up ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-card border border-line bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {Icon && (
          <span className="grid size-10 place-items-center rounded-full border border-line bg-raised text-fg">
            <Icon className="size-[1.125rem]" aria-hidden="true" />
          </span>
        )}
      </div>
      <CountUp value={value} format={format} className="text-3xl font-bold text-fg" />
      {trend && (
        <p className="flex items-center gap-1.5 text-sm">
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              up ? 'text-success' : 'text-danger',
            )}
          >
            <TrendIcon className="size-4" aria-hidden="true" />
            {up ? '+' : '−'}
            {formatNumber(Math.abs(trend.value))} %
          </span>
          {trend.label && <span className="text-fg-subtle">{trend.label}</span>}
        </p>
      )}
    </div>
  )
}
