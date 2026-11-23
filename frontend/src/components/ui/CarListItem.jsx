import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { relationName } from '../../lib/cars.js'
import { cn } from '../../lib/cn.js'
import { CarSpecs } from './CarCard.jsx'
import CarImage from './CarImage.jsx'
import IconButton from './IconButton.jsx'
import Skeleton from './Skeleton.jsx'

/**
 * Compact row (thumbnail, name, details, circular action), like a playlist row.
 * Used in lists and "Mes réservations". `subtitle` replaces the specs line (e.g. the
 * reservation dates); `meta` adds a small third line (e.g. the reference); `trailing`
 * adds content before the action (e.g. a StatusBadge).
 *
 * @example
 * <CarListItem car={car} subtitle="12 – 15 déc. 2026" trailing={<StatusBadge status="confirmed" />} to="/espace/reservations/TMB-2026-000012" />
 */
export default function CarListItem({
  car,
  title,
  subtitle,
  meta,
  trailing,
  to,
  onAction,
  actionIcon = ChevronRight,
  actionLabel = 'Voir le détail',
  className,
}) {
  const name = title ?? [relationName(car.brand), car.model].filter(Boolean).join(' ')

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3 rounded-card border border-transparent p-2 pr-3 transition-[background-color,border-color] duration-150 hover:border-line hover:bg-surface sm:gap-4',
        className,
      )}
    >
      <CarImage
        car={car}
        className="h-14 w-20 shrink-0 rounded-sm sm:h-16 sm:w-24"
        placeholderClassName="p-1.5"
        sizes="96px"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-base font-semibold text-fg">
          {to ? (
            <Link
              to={to}
              className="rounded-xs after:absolute after:inset-0 after:rounded-card after:content-['']"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
        {subtitle ? (
          <p className="truncate text-sm text-fg-muted tabular-nums">{subtitle}</p>
        ) : (
          <CarSpecs car={car} compact className="flex-nowrap overflow-hidden" />
        )}
        {meta && <p className="truncate text-xs text-fg-subtle tabular-nums">{meta}</p>}
        {trailing && <div className="mt-1 sm:hidden">{trailing}</div>}
      </div>
      {trailing && <div className="hidden shrink-0 sm:block">{trailing}</div>}
      {to ? (
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-raised text-fg transition-colors duration-150 group-hover:bg-lime group-hover:text-on-lime"
        >
          <ActionIcon icon={actionIcon} />
        </span>
      ) : (
        onAction && (
          <IconButton
            icon={actionIcon}
            label={actionLabel}
            size="sm"
            onClick={() => onAction(car)}
            className="relative z-10 size-10"
          />
        )
      )}
    </div>
  )
}

function ActionIcon({ icon: Icon }) {
  return <Icon className="size-[1.125rem]" />
}

export function CarListItemSkeleton({ className }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3 p-2 pr-3 sm:gap-4', className)}>
      <Skeleton className="h-14 w-20 shrink-0 rounded-sm sm:h-16 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3.5 w-56 max-w-full" />
      </div>
      <Skeleton className="size-10 shrink-0 rounded-full" />
    </div>
  )
}
