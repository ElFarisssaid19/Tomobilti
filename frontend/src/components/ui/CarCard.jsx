import { Cog, Fuel, Heart, Snowflake, Users } from 'lucide-react'
import { Link } from 'react-router'
import { relationName } from '../../lib/cars.js'
import { cn } from '../../lib/cn.js'
import { FUEL_TYPE, label, TRANSMISSION } from '../../lib/labels.js'
import { formatPrice } from '../../utils/format.js'
import Button from './Button.jsx'
import { buttonClasses } from './buttonStyles.js'
import CarImage from './CarImage.jsx'
import { CARD_GROUP_HOVER } from './cardStyles.js'
import IconButton from './IconButton.jsx'
import Skeleton from './Skeleton.jsx'

/** Specs row shared by CarCard and CarListItem. */
export function CarSpecs({ car, compact = false, className }) {
  const specs = [
    car.seats && { icon: Users, text: `${car.seats} places` },
    car.transmission && { icon: Cog, text: label(TRANSMISSION, car.transmission) },
    car.fuel && { icon: Fuel, text: label(FUEL_TYPE, car.fuel) },
    car.air_conditioning && !compact && { icon: Snowflake, text: 'Clim' },
  ].filter(Boolean)

  return (
    <ul
      aria-label="Caractéristiques"
      className={cn('flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-fg-muted', className)}
    >
      {specs.map(({ icon: Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-1.5">
          <Icon className="size-4 text-fg-subtle" aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  )
}

/**
 * Catalogue card. `car` follows the API car fields (docs/database.md): brand, model,
 * year, category, seats, transmission, fuel, air_conditioning, price_per_day ("250.00"),
 * and an image (image_url, primary_image or images[]; full URLs or storage paths).
 *
 * The whole card is clickable through the title link (`to`); the favorite button sits
 * above it. Without `to`, the CTA becomes a real button calling `onReserve`.
 *
 * @example <CarCard car={car} to={`/voitures/${car.slug}`} isFavorite={fav} onToggleFavorite={toggle} />
 */
export default function CarCard({
  car,
  to,
  onReserve,
  isFavorite = false,
  onToggleFavorite,
  ctaLabel = 'Réserver',
  eager = false,
  className,
}) {
  const brand = relationName(car.brand)
  const category = relationName(car.category)
  const title = car.model

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-card-lg border border-line bg-surface p-2.5',
        CARD_GROUP_HOVER,
        className,
      )}
    >
      <div className="relative">
        <CarImage car={car} eager={eager} className="aspect-[16/10] rounded-card" />
        {category && (
          <span className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full border border-white/10 bg-canvas/70 px-3 text-xs font-semibold text-fg backdrop-blur-md">
            {category}
          </span>
        )}
        {onToggleFavorite && (
          <IconButton
            icon={Heart}
            label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isFavorite}
            size="sm"
            onClick={() => onToggleFavorite(car)}
            className={cn(
              'absolute top-3 right-3 z-10 border-white/10 bg-canvas/70 backdrop-blur-md hover:bg-raised',
              isFavorite && '[&_svg]:fill-lime [&_svg]:text-lime',
            )}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-2.5 pt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          {brand && <p className="text-sm font-medium text-fg-muted">{brand}</p>}
          <h3 className="text-lg leading-snug font-bold text-fg">
            {to ? (
              <Link
                to={to}
                className="rounded-xs after:absolute after:inset-0 after:rounded-card-lg after:content-[''] focus-visible:outline-offset-4"
              >
                {title}
              </Link>
            ) : (
              title
            )}
            {car.year && (
              <span className="ml-2 text-sm font-medium text-fg-subtle tabular-nums">
                {car.year}
              </span>
            )}
          </h3>
        </div>

        <CarSpecs car={car} />

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <p className="flex flex-col">
            <span className="text-xs font-medium text-fg-subtle">à partir de</span>
            <span className="text-fg-muted">
              <span className="text-xl font-bold text-accent-text tabular-nums">
                {formatPrice(car.price_per_day)}
              </span>
              <span className="text-sm"> / jour</span>
            </span>
          </p>
          {to ? (
            // Decorative: the stretched title link already makes the card clickable.
            <span
              aria-hidden="true"
              className={buttonClasses({
                size: 'sm',
                className: 'group-hover:bg-lime-hover group-hover:shadow-glow-lime',
              })}
            >
              {ctaLabel}
            </span>
          ) : (
            <Button size="sm" onClick={() => onReserve?.(car)}>
              {ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

/** Loading placeholder with the exact CarCard layout. */
export function CarCardSkeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col rounded-card-lg border border-line bg-surface p-2.5', className)}
    >
      <Skeleton className="aspect-[16/10] rounded-card" />
      <div className="flex flex-col gap-4 px-2.5 pt-4 pb-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex items-end justify-between border-t border-line pt-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}
