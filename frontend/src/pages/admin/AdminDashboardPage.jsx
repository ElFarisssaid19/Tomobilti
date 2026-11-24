import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Gauge,
  Hourglass,
  KeyRound,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router'
import CarStatusBadge from '../../components/admin/CarStatusBadge.jsx'
import RevenueChart from '../../components/admin/charts/RevenueChart.jsx'
import MeterList from '../../components/admin/charts/MeterList.jsx'
import WeeklyChart from '../../components/admin/charts/WeeklyChart.jsx'
import ReservationCard from '../../components/admin/ReservationCard.jsx'
import {
  Button,
  Card,
  Chip,
  ChipGroup,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import { useDashboard } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { formatShortDate, formatTime } from '../../lib/adminFormat.js'
import { firstName } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { RESERVATION_STATUS } from '../../lib/labels.js'
import { formatDate, formatNumber, formatPrice } from '../../utils/format.js'

const PERIODS = { '30d': '30 jours', '90d': '90 jours', '12m': '12 mois' }
/* KPI grid: the two amounts share the first row, the three counts the second (one row from 1536px). */
const WIDE = 'lg:col-span-3 2xl:col-span-1'
const NARROW = 'lg:col-span-2 2xl:col-span-1'

const FILTERS = { period: { type: 'enum', values: Object.keys(PERIODS), default: '30d' } }

/** /admin: the agency's day first, then the period's figures and charts. */
export default function AdminDashboardPage() {
  usePageMeta('Tableau de bord')
  const { user } = useAuth()
  const { filters, setFilters } = useUrlFilters(FILTERS)
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useDashboard(
    filters.period,
  )

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Bonjour, ${firstName(user)}`}
        description={
          data
            ? `Chiffres du ${formatShortDate(data.period.from)} au ${formatShortDate(data.period.to)}.`
            : 'Les chiffres de l’agence.'
        }
        actions={
          <ChipGroup
            label="Période"
            value={filters.period}
            onChange={(period) => setFilters({ period })}
          >
            {Object.entries(PERIODS).map(([value, text]) => (
              <Chip key={value} value={value}>
                {text}
              </Chip>
            ))}
          </ChipGroup>
        }
      />

      {isPending && <DashboardSkeleton />}
      {isError && (
        <ErrorState
          title="Impossible de charger le tableau de bord"
          error={error}
          onRetry={refetch}
        />
      )}
      {data && (
        <div
          className={cn(
            'flex flex-col gap-8 transition-opacity duration-150',
            isPlaceholderData && 'opacity-60',
          )}
          aria-busy={isPlaceholderData}
        >
          <Kpis kpis={data.kpis} period={data.period} />

          <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
            <Agenda days={data.today} />
            <Alerts alerts={data.alerts} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="lg" className="flex min-w-0 flex-col gap-4">
              <CardTitle
                title="Chiffre d’affaires par mois"
                text="Locations terminées, sur les 12 derniers mois."
              />
              <RevenueChart data={data.charts.revenue_by_month} />
            </Card>
            <Card padding="lg" className="flex min-w-0 flex-col gap-4">
              <CardTitle
                title="Réservations par semaine"
                text={`Demandes reçues sur ${data.period.label}.`}
              />
              <WeeklyChart data={data.charts.reservations_by_week} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card padding="lg" className="flex flex-col gap-5">
              <CardTitle
                title="Top 5 des voitures"
                text="Chiffre d’affaires des locations terminées."
              />
              <MeterList
                label="Voitures qui rapportent le plus"
                items={data.charts.top_cars.map((row) => ({
                  key: row.car.id,
                  label: `${row.car.name} ${row.car.year}`,
                  value: Number(row.revenue),
                  display: formatPrice(row.revenue),
                  detail: `${row.reservations} location${row.reservations > 1 ? 's' : ''}, ${row.car.plate_number}`,
                }))}
              />
            </Card>
            <Card padding="lg" className="flex flex-col gap-5">
              <CardTitle
                title="Par catégorie"
                text="Réservations reçues, hors annulées et refusées."
              />
              <MeterList
                label="Réservations par catégorie"
                items={shareItems(data.charts.by_category)}
              />
            </Card>
            <Card padding="lg" className="flex flex-col gap-5">
              <CardTitle
                title="Par agence de départ"
                text="Réservations reçues, hors annulées et refusées."
              />
              <MeterList
                label="Réservations par agence"
                items={shareItems(data.charts.by_agency)}
              />
            </Card>
          </div>

          <Recent reservations={data.recent} />
        </div>
      )}
    </div>
  )
}

function shareItems(rows) {
  const total = rows.reduce((sum, row) => sum + row.reservations, 0)
  return rows.map((row) => ({
    key: row.id,
    label: row.name,
    value: row.reservations,
    display: formatNumber(row.reservations),
    detail: `${formatNumber(Math.round((row.reservations / total) * 100))} % des réservations, ${formatPrice(row.amount)}`,
  }))
}

function CardTitle({ title, text, action }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-fg">{title}</h2>
        {text && <p className="text-sm text-fg-muted">{text}</p>}
      </div>
      {action}
    </div>
  )
}

function Kpis({ kpis, period }) {
  const revenue = Number(kpis.revenue)
  const previous = Number(kpis.revenue_previous)
  const trend =
    previous > 0
      ? {
          value: Math.round(((revenue - previous) / previous) * 100),
          label: 'vs période précédente',
        }
      : undefined
  const counts = kpis.reservations.by_status

  return (
    <section aria-label="Chiffres clés" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 2xl:grid-cols-5">
        <StatCard
          className={WIDE}
          icon={Wallet}
          label="Chiffre d’affaires"
          value={revenue}
          format="price"
          trend={trend}
          hint={`Locations terminées sur ${period.label}`}
        />
        <StatCard
          className={WIDE}
          icon={CalendarClock}
          label="Chiffre d’affaires attendu"
          value={Number(kpis.expected_revenue)}
          format="price"
          hint="Réservations confirmées et en cours"
        />
        <StatCard
          className={NARROW}
          icon={Hourglass}
          label="Demandes à traiter"
          value={kpis.pending_requests}
          hint="En attente de votre réponse"
        />
        <StatCard
          className={NARROW}
          icon={KeyRound}
          label="Locations en cours"
          value={kpis.active_rentals}
          hint="Voitures chez un client"
        />
        <StatCard
          className={cn(NARROW, 'sm:col-span-2')}
          icon={Gauge}
          label="Taux d’utilisation"
          value={kpis.utilisation.rate}
          format="percent"
          hint={`${formatNumber(kpis.utilisation.booked_days)} jours loués sur ${formatNumber(kpis.utilisation.available_car_days)}`}
        />
      </div>
      <Card padding="md" className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">
          <span className="font-semibold text-fg tabular-nums">
            {formatNumber(kpis.reservations.total)}
          </span>{' '}
          réservations reçues sur {period.label}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Réservations reçues par statut">
          {Object.keys(RESERVATION_STATUS).map((status) => (
            <li key={status} className="flex items-center gap-2">
              <StatusBadge status={status} />
              <span className="text-sm font-semibold text-fg tabular-nums">
                {formatNumber(counts[status])}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

/** The handovers of today and tomorrow: the one bold element of the dashboard. */
function Agenda({ days }) {
  return (
    <Card padding="lg" size="lg" className="flex min-w-0 flex-col gap-6">
      <CardTitle
        title="Départs et retours"
        text="Les remises de clés d’aujourd’hui et de demain."
        action={
          <Button to="/admin/reservations?tab=today" variant="ghost" size="sm">
            Voir la journée
          </Button>
        }
      />
      <div className="grid gap-8 lg:grid-cols-2">
        {days.map((day, index) => {
          const events = [
            ...day.pickups.map((reservation) => ({
              kind: 'pickup',
              at: reservation.start_at,
              reservation,
            })),
            ...day.returns.map((reservation) => ({
              kind: 'return',
              at: reservation.end_at,
              reservation,
            })),
          ].sort((a, b) => a.at.localeCompare(b.at))

          return (
            <section
              key={day.date}
              aria-labelledby={`agenda-${day.date}`}
              className="flex min-w-0 flex-col gap-3"
            >
              <h3
                id={`agenda-${day.date}`}
                className="flex items-baseline gap-2 text-base font-semibold text-fg"
              >
                {index === 0 ? 'Aujourd’hui' : 'Demain'}
                <span className="text-sm font-normal text-fg-subtle">
                  {formatDate(`${day.date}T12:00:00`, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </h3>
              {events.length === 0 ? (
                <p className="rounded-card border border-dashed border-line px-4 py-6 text-sm text-fg-muted">
                  Aucun départ ni retour.
                </p>
              ) : (
                <ol className="flex flex-col divide-y divide-line">
                  {events.map((event) => (
                    <AgendaItem
                      key={`${event.kind}-${event.reservation.reference}`}
                      event={event}
                    />
                  ))}
                </ol>
              )}
            </section>
          )
        })}
      </div>
    </Card>
  )
}

function AgendaItem({ event }) {
  const { reservation } = event
  const isPickup = event.kind === 'pickup'
  const Icon = isPickup ? ArrowUpRight : ArrowDownLeft
  const place = isPickup ? reservation.pickup_location : reservation.return_location

  return (
    <li>
      <Link
        to={`/admin/reservations/${reservation.reference}`}
        className="-mx-2 flex items-start gap-4 rounded-input px-2 py-3 transition-colors duration-150 hover:bg-raised/60"
      >
        <span className="w-16 shrink-0 text-2xl leading-none font-bold text-fg tabular-nums">
          {formatTime(event.at)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <Icon className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
            {isPickup ? 'Départ' : 'Retour'}
            <span className="truncate font-normal text-fg-muted">, {place?.name}</span>
          </span>
          <span className="truncate text-sm text-fg">
            {reservation.car?.name}{' '}
            <span className="text-fg-subtle tabular-nums">{reservation.car?.plate_number}</span>
          </span>
          <span className="truncate text-sm text-fg-muted">{reservation.client?.name}</span>
          <StatusBadge status={reservation.status} className="mt-1 self-start sm:hidden" />
        </span>
        <StatusBadge status={reservation.status} className="mt-0.5 hidden sm:inline-flex" />
      </Link>
    </li>
  )
}

function Alerts({ alerts }) {
  const { pending_soon: pendingSoon, cars_unavailable: cars } = alerts

  return (
    <Card padding="md" className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
      <h2 className="text-lg font-bold text-fg md:col-span-2 2xl:col-span-1">Alertes</h2>

      <section className="flex flex-col gap-2" aria-labelledby="alert-pending">
        <h3 id="alert-pending" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Hourglass
            className={cn('size-4', pendingSoon.length ? 'text-warning' : 'text-fg-subtle')}
            aria-hidden="true"
          />
          Départs dans moins de 48 h sans réponse
        </h3>
        {pendingSoon.length === 0 ? (
          <p className="text-sm text-fg-muted">Aucune demande urgente.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {pendingSoon.map((reservation) => (
              <li key={reservation.reference} className="min-w-0">
                <Link
                  to={`/admin/reservations/${reservation.reference}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-raised/60"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold text-fg tabular-nums">
                      {reservation.reference}
                    </span>
                    <span className="truncate text-fg-muted">
                      {reservation.car?.name}, {reservation.client?.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-fg-muted tabular-nums">
                    {formatDate(reservation.start_at, {
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="alert-cars">
        <h3 id="alert-cars" className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Wrench
            className={cn('size-4', cars.length ? 'text-warning' : 'text-fg-subtle')}
            aria-hidden="true"
          />
          Voitures indisponibles
        </h3>
        {cars.length === 0 ? (
          <p className="text-sm text-fg-muted">Toute la flotte est disponible.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {cars.map((car) => (
              <li key={car.id}>
                <Link
                  to={`/admin/voitures/${car.id}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-raised/60"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-fg">
                      {car.name} {car.year}
                    </span>
                    <span className="text-fg-subtle tabular-nums">{car.plate_number}</span>
                  </span>
                  <CarStatusBadge status={car.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  )
}

function Recent({ reservations }) {
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardTitle
        title="Dernières réservations"
        action={
          <Button to="/admin/reservations?tab=all" variant="ghost" size="sm">
            Voir toutes
          </Button>
        }
      />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reservations.map((reservation) => (
          <li key={reservation.reference} className="min-w-0">
            <ReservationCard reservation={reservation} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <LoadingRegion label="Chargement du tableau de bord…" className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-40 rounded-card" />
        ))}
      </div>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="h-80 rounded-card-lg" />
        <Skeleton className="h-80 rounded-card" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </LoadingRegion>
  )
}
