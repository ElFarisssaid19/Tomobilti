import { Clock, MapPin, Phone, Plane, Store } from 'lucide-react'
import { Link } from 'react-router'
import { formatPhone } from '../../config/agency.js'
import { useLocations } from '../../hooks/useCatalog.js'
import { cn } from '../../lib/cn.js'
import { Badge, ErrorState, LoadingRegion, Skeleton } from '../ui'

/**
 * Pick-up points from GET /api/locations: name, airport or agency, address, hours,
 * phone, and a link to the cars based there.
 */
export default function AgencyList({ className, showCarsLink = true }) {
  const { data: locations, isPending, isError, error, refetch } = useLocations()

  if (isPending) {
    return (
      <LoadingRegion
        label="Chargement des agences…"
        className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      >
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-52 rounded-card" />
        ))}
      </LoadingRegion>
    )
  }

  if (isError) {
    return <ErrorState title="Impossible de charger les agences" error={error} onRetry={refetch} />
  }

  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {locations.map((location) => (
        <li key={location.slug}>
          <AgencyCard location={location} showCarsLink={showCarsLink} />
        </li>
      ))}
    </ul>
  )
}

export function AgencyCard({ location, showCarsLink = false, className }) {
  const isAirport = location.type === 'airport'
  const TypeIcon = isAirport ? Plane : Store

  return (
    <article
      className={cn(
        'flex h-full flex-col gap-4 rounded-card border border-line bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-fg-muted">{location.city}</p>
          <h3 className="text-lg leading-snug font-bold text-fg">{location.name}</h3>
        </div>
        <Badge tone={isAirport ? 'info' : 'neutral'} icon={TypeIcon} className="shrink-0">
          {location.type_label}
        </Badge>
      </div>
      <ul className="flex flex-col gap-2.5 text-sm text-fg-muted">
        <li className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <span>{location.address}</span>
        </li>
        {location.opening_hours && (
          <li className="flex gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <span>
              <span className="sr-only">Horaires : </span>
              {location.opening_hours}
            </span>
          </li>
        )}
        {location.phone && (
          <li className="flex gap-2.5">
            <Phone className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <a
              href={`tel:${location.phone}`}
              className="link-underline rounded-xs text-fg tabular-nums"
            >
              {formatPhone(location.phone)}
            </a>
          </li>
        )}
      </ul>
      {showCarsLink && (
        <Link
          to={`/voitures?location=${encodeURIComponent(location.slug)}`}
          className="link-underline mt-auto self-start rounded-xs text-sm font-semibold text-accent-text"
        >
          Voir les voitures de cette agence
        </Link>
      )}
    </article>
  )
}
