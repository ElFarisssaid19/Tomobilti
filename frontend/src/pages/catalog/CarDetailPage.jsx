import {
  Briefcase,
  CalendarDays,
  CarFront,
  Cog,
  DoorOpen,
  Fuel,
  Palette,
  Snowflake,
  Users,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import CarGallery from '../../components/catalog/CarGallery.jsx'
import { AgencyCard } from '../../components/site/AgencyList.jsx'
import {
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  CarCard,
  DateRangePicker,
  EmptyState,
  ErrorState,
  InfoTip,
  LoadingRegion,
  Skeleton,
} from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import { useCar, useCarAvailability, useExtras } from '../../hooks/useCatalog.js'
import useFavorites from '../../hooks/useFavorites.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { formatDays, overlapsUnavailable, toDay, toInputDate } from '../../lib/dates.js'
import { iconFor } from '../../lib/icons.js'
import { FUEL_TYPE, label, TRANSMISSION } from '../../lib/labels.js'
import { revealOnView, staggerItem } from '../../lib/motion.js'
import { estimateRental } from '../../lib/pricing.js'
import { formatPrice } from '../../utils/format.js'

/**
 * /voitures/:slug: gallery with credits, specs, price, deposit, home agency, options,
 * the availability calendar with the estimated total, and similar cars. The chosen
 * dates live in the URL (?start_at&end_at), so they survive the login detour.
 */
export default function CarDetailPage() {
  const { slug } = useParams()
  const { data, isPending, isError, error, refetch } = useCar(slug)
  const car = data?.car
  const notFound = error?.response?.status === 404

  usePageMeta(
    car ? `${car.name} ${car.year} à louer` : notFound ? 'Voiture introuvable' : 'Voiture',
    car
      ? `Louez la ${car.name} ${car.year} (${car.category?.name ?? 'voiture'}) à partir de ${formatPrice(car.price_per_day)} par jour, au départ de ${car.location?.name ?? 'nos agences'}. Caution : ${formatPrice(car.deposit_amount)}.`
      : undefined,
  )

  if (isPending) return <DetailSkeleton />

  if (isError) {
    return (
      <div className="container-page flex flex-1 flex-col gap-6 pt-24 pb-16 md:pt-32">
        {notFound ? (
          <EmptyState
            icon={CarFront}
            title="Cette voiture n’est pas disponible"
            titleAs="h1"
            text="Elle a peut-être quitté la flotte."
            action={<Button to="/voitures">Voir les voitures</Button>}
          />
        ) : (
          <ErrorState
            title="Impossible de charger la voiture"
            titleAs="h1"
            error={error}
            onRetry={refetch}
          />
        )}
      </div>
    )
  }

  return <CarDetail car={car} similar={data.similar} />
}

function CarDetail({ car, similar }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [searchParams] = useSearchParams()
  const datesQuery =
    searchParams.get('start_at') && searchParams.get('end_at')
      ? `?start_at=${searchParams.get('start_at')}&end_at=${searchParams.get('end_at')}`
      : ''

  return (
    <div className="container-page flex flex-1 flex-col gap-8 pt-24 pb-16 md:pt-32">
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: 'Accueil', to: '/' },
            { label: 'Voitures', to: '/voitures' },
            car.category && {
              label: car.category.name,
              to: `/voitures?category=${encodeURIComponent(car.category.slug)}`,
            },
            { label: car.name },
          ].filter(Boolean)}
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {car.category && <Badge>{car.category.name}</Badge>}
            <Badge tone="neutral">{car.year}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-balance text-fg md:text-4xl">{car.name}</h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        <div className="lg:col-start-1 lg:row-start-1">
          <CarGallery car={car} />
        </div>

        <aside aria-label="Réservation" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <BookingCard car={car} />
        </aside>

        <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-2">
          <Specs car={car} />
          {car.description && (
            <section aria-labelledby="description" className="flex flex-col gap-3">
              <h2 id="description" className="text-xl font-bold text-fg">
                Description
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-fg-muted">{car.description}</p>
            </section>
          )}
          {car.location && (
            <section aria-labelledby="agence" className="flex flex-col gap-3">
              <h2 id="agence" className="text-xl font-bold text-fg">
                Agence de départ
              </h2>
              <AgencyCard location={car.location} className="max-w-md" />
            </section>
          )}
          <Extras />
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similaires" className="flex flex-col gap-5 pt-6">
          <h2 id="similaires" className="text-2xl font-bold text-fg">
            Voitures similaires
          </h2>
          <motion.ul {...revealOnView} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {similar.map((item) => (
              <motion.li key={item.slug} variants={staggerItem}>
                <CarCard
                  car={item}
                  to={`/voitures/${item.slug}${datesQuery}`}
                  isFavorite={isFavorite(item.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}
    </div>
  )
}

/**
 * Price, deposit, calendar (booked days disabled), estimated total and "Réserver".
 * Guests go to the login page and come back here with the same dates.
 */
function BookingCard({ car }) {
  const navigate = useNavigate()
  const { status } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const availability = useCarAvailability(car.slug)
  const unavailable = availability.data?.unavailable ?? []
  const [range, setRange] = useState(() => {
    const from = toDay(searchParams.get('start_at'))
    const to = toDay(searchParams.get('end_at'))
    return from && to && to > from ? { from, to } : undefined
  })
  const [error, setError] = useState(null)

  const conflict = overlapsUnavailable(range, unavailable)
  const estimate = conflict ? null : estimateRental(car.price_per_day, range)

  function changeRange(next) {
    setRange(next)
    setError(null)
    const complete = next?.from && next?.to
    if (complete || !next) {
      setSearchParams(
        complete ? { start_at: toInputDate(next.from), end_at: toInputDate(next.to) } : {},
        { replace: true, preventScrollReset: true },
      )
    }
  }

  function reserve() {
    if (!estimate) {
      setError(
        conflict
          ? 'Ces dates ne sont plus libres. Choisissez d’autres dates.'
          : 'Choisissez vos dates de départ et de retour.',
      )
      return
    }
    const dates = `start_at=${toInputDate(range.from)}&end_at=${toInputDate(range.to)}`
    if (status === 'authenticated') {
      navigate(`/reserver/${car.slug}?${dates}`)
    } else {
      const back = `/voitures/${car.slug}?${dates}`
      navigate(`/connexion?redirect=${encodeURIComponent(back)}`)
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-card-lg border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-28">
      <div className="flex items-end justify-between gap-4">
        <p className="flex flex-col">
          <span className="text-sm text-fg-muted">Prix par jour, TTC</span>
          <span className="text-3xl font-bold text-accent-text tabular-nums">
            {formatPrice(car.price_per_day)}
          </span>
        </p>
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1 text-sm text-fg-muted">
            Caution
            <InfoTip
              label="À propos de la caution"
              content="Bloquée à la prise en charge, rendue au retour. Jamais incluse dans le total."
              className="-my-1"
            />
          </span>
          <span className="text-lg font-semibold text-fg tabular-nums">
            {formatPrice(car.deposit_amount)}
          </span>
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <DateRangePicker
          label="Vos dates"
          value={range}
          onChange={changeRange}
          unavailable={unavailable}
          error={error}
          hint={
            availability.isPending
              ? 'Chargement des jours déjà réservés…'
              : availability.isError
                ? 'Les jours déjà réservés n’ont pas pu être chargés.'
                : unavailable.length > 0
                  ? 'Les jours barrés sont déjà réservés.'
                  : undefined
          }
        />
      </div>

      {conflict && !error && (
        <Alert tone="warning" title="Dates indisponibles">
          Cette voiture est déjà réservée sur une partie de ces dates. Choisissez d’autres dates.
        </Alert>
      )}

      {estimate && (
        <dl
          aria-live="polite"
          className="flex flex-col gap-2 rounded-card border border-line bg-raised/50 p-4 text-sm"
        >
          <div className="flex justify-between gap-4 text-fg-muted">
            <dt>
              {formatPrice(car.price_per_day)} × {formatDays(estimate.days)}
            </dt>
            <dd className="tabular-nums">{formatPrice(estimate.total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
            <dt className="font-semibold text-fg">Total estimé</dt>
            <dd className="text-xl font-bold text-fg tabular-nums">
              {formatPrice(estimate.total)}
            </dd>
          </div>
          <p className="text-xs text-fg-subtle">Hors options et caution.</p>
        </dl>
      )}

      <Button size="lg" onClick={reserve} className="w-full">
        Réserver
      </Button>
      {status !== 'authenticated' && (
        <p className="-mt-2 text-center text-sm text-fg-subtle">
          Connexion requise, vos dates sont gardées.
        </p>
      )}
    </div>
  )
}

function Specs({ car }) {
  const specs = [
    { icon: Users, label: 'Places', value: car.seats },
    { icon: DoorOpen, label: 'Portes', value: car.doors },
    { icon: Briefcase, label: 'Valises', value: car.luggage },
    { icon: Cog, label: 'Boîte', value: label(TRANSMISSION, car.transmission) },
    { icon: Fuel, label: 'Carburant', value: label(FUEL_TYPE, car.fuel) },
    { icon: Snowflake, label: 'Climatisation', value: car.air_conditioning ? 'Oui' : 'Non' },
    { icon: CalendarDays, label: 'Année', value: car.year },
    car.color && { icon: Palette, label: 'Couleur', value: car.color },
  ].filter(Boolean)

  return (
    <section aria-labelledby="caracteristiques" className="flex flex-col gap-4">
      <h2 id="caracteristiques" className="text-xl font-bold text-fg">
        Caractéristiques
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex flex-col rounded-card border border-line bg-surface p-4"
          >
            <dt className="flex flex-col gap-3 text-sm text-fg-muted">
              <spec.icon className="size-5 text-fg-subtle" aria-hidden="true" />
              {spec.label}
            </dt>
            <dd className="font-semibold text-fg tabular-nums">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Options from GET /api/extras, read-only: they are chosen when booking (Phase 4). */
function Extras() {
  const { data: extras, isPending, isError } = useExtras()

  if (isError || (!isPending && extras.length === 0)) return null

  return (
    <section aria-labelledby="options" className="flex flex-col gap-4">
      <h2 id="options" className="text-xl font-bold text-fg">
        Options disponibles
      </h2>
      {isPending ? (
        <LoadingRegion label="Chargement des options…" className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-20 rounded-card" />
          ))}
        </LoadingRegion>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {extras.map((extra) => {
            const Icon = iconFor(extra.icon)
            return (
              <li
                key={extra.slug}
                className="flex gap-3 rounded-card border border-line bg-surface p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-raised text-fg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold text-fg">{extra.name}</h3>
                    <p className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                      {formatPrice(extra.price)}
                      <span className="font-normal text-fg-muted">
                        {extra.pricing === 'per_day' ? ' / jour' : ' / location'}
                      </span>
                    </p>
                  </div>
                  {extra.description && (
                    <p className="text-sm text-fg-muted">{extra.description}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <LoadingRegion
      label="Chargement de la voiture…"
      className="container-page flex flex-1 flex-col gap-8 pt-24 pb-16 md:pt-32"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-72 rounded-input" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        <Skeleton className="aspect-[16/10] w-full rounded-card-lg" />
        <Skeleton className="h-96 w-full rounded-card-lg" />
      </div>
    </LoadingRegion>
  )
}
