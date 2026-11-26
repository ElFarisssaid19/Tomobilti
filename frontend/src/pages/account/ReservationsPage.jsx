import { CalendarClock, CalendarX, Flag, KeyRound, ReceiptText } from 'lucide-react'
import { motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import {
  Button,
  CarListItem,
  CarListItemSkeleton,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Pagination,
  StatusBadge,
  Tabs,
} from '../../components/ui'
import usePageMeta from '../../hooks/usePageMeta.js'
import { useReservations } from '../../hooks/useReservations.js'
import { formatPeriod } from '../../lib/booking.js'
import { cn } from '../../lib/cn.js'
import { RESERVATION_TAB } from '../../lib/labels.js'
import { staggerContainer, staggerItem } from '../../lib/motion.js'
import { formatPrice } from '../../utils/format.js'

const TABS = Object.keys(RESERVATION_TAB)

const EMPTY = {
  upcoming: {
    icon: CalendarClock,
    title: 'Aucune réservation à venir',
  },
  current: {
    icon: KeyRound,
    title: 'Aucune location en cours',
  },
  past: {
    icon: Flag,
    title: 'Aucune location passée',
  },
  cancelled: {
    icon: CalendarX,
    title: 'Aucune réservation annulée',
  },
}

/**
 * /espace/reservations?tab&page: my reservations in 4 tabs (À venir, En cours,
 * Passées, Annulées). The tab and the page live in the URL.
 */
export default function ReservationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'upcoming'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const query = useReservations({ tab, page })
  const counts = query.data?.meta?.counts

  usePageMeta('Mes réservations', 'Vos réservations Tomobilti : à venir, en cours et passées.')

  function changeTab(index) {
    setSearchParams(index === 0 ? {} : { tab: TABS[index] })
  }

  function changePage(nextPage) {
    setSearchParams({ ...(tab !== 'upcoming' && { tab }), page: String(nextPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titleAs="h2"
        title="Mes réservations"
        actions={
          <Button to="/voitures" variant="secondary">
            Réserver une voiture
          </Button>
        }
      />
      <Tabs
        label="Mes réservations"
        selectedIndex={TABS.indexOf(tab)}
        onChange={changeTab}
        tabs={TABS.map((key) => ({
          label: RESERVATION_TAB[key],
          count: counts?.[key],
          content:
            key === tab ? (
              <ReservationList tab={key} query={query} onPageChange={changePage} />
            ) : null,
        }))}
      />
    </div>
  )
}

function ReservationList({ tab, query, onPageChange }) {
  const { data, isPending, isError, error, refetch, isPlaceholderData } = query

  if (isPending) {
    return (
      <LoadingRegion label="Chargement de vos réservations…" className="flex flex-col gap-2">
        {[1, 2, 3].map((item) => (
          <CarListItemSkeleton key={item} />
        ))}
      </LoadingRegion>
    )
  }

  if (isError) {
    return (
      <ErrorState title="Impossible de charger vos réservations" error={error} onRetry={refetch} />
    )
  }

  // While another tab loads, the previous rows stay (dimmed): only show the new tab's.
  const rows = data.meta.tab === tab ? data.data : []

  if (rows.length === 0 && !isPlaceholderData) {
    const empty = EMPTY[tab]
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        action={<Button to="/voitures">Voir les voitures</Button>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.ul
        key={`${tab}-${data.meta.current_page}`}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        aria-busy={isPlaceholderData || undefined}
        className={cn(
          'flex flex-col gap-1 transition-opacity duration-150',
          isPlaceholderData && 'opacity-60',
        )}
      >
        {rows.map((reservation) => (
          <motion.li key={reservation.reference} variants={staggerItem}>
            <CarListItem
              car={reservation.car}
              title={reservation.car.name}
              subtitle={formatPeriod(reservation.start_at, reservation.end_at)}
              meta={reservation.reference}
              to={`/espace/reservations/${reservation.reference}`}
              trailing={
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <StatusBadge status={reservation.status} />
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-fg tabular-nums">
                    {reservation.invoice && (
                      <ReceiptText
                        className="size-4 text-fg-subtle"
                        role="img"
                        aria-label="Facture disponible"
                      />
                    )}
                    {formatPrice(reservation.total)}
                  </span>
                </div>
              }
            />
          </motion.li>
        ))}
      </motion.ul>
      <Pagination
        page={data.meta.current_page}
        lastPage={data.meta.last_page}
        onPageChange={onPageChange}
      />
    </div>
  )
}
