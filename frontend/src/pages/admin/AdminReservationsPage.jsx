import { CalendarX, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { exportReservations } from '../../api/admin.js'
import CarThumb from '../../components/admin/CarThumb.jsx'
import FilterPanel from '../../components/admin/FilterPanel.jsx'
import SearchField from '../../components/admin/SearchField.jsx'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  Table,
  Tabs,
} from '../../components/ui'
import { useAdminCars, useAdminReservations, useSettings } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { formatShortDateTime } from '../../lib/adminFormat.js'
import { downloadBlob } from '../../lib/download.js'
import { RESERVATION_FILTERS } from '../../lib/adminReservations.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { ADMIN_RESERVATION_TAB, RESERVATION_STATUS, toOptions } from '../../lib/labels.js'
import { countActiveFilters, filtersToApiParams } from '../../lib/urlFilters.js'
import { formatPhone, formatPrice } from '../../utils/format.js'

const TABS = Object.keys(ADMIN_RESERVATION_TAB)

const SORTS = [
  { value: '', label: 'Ordre de l’onglet' },
  { value: 'start_at:asc', label: 'Départ le plus proche' },
  { value: 'start_at:desc', label: 'Départ le plus lointain' },
  { value: 'created_at:desc', label: 'Demandes récentes' },
  { value: 'total:desc', label: 'Montant décroissant' },
]

const EMPTY = {
  pending: { title: 'Aucune demande à traiter' },
  today: { title: 'Aucun départ ni retour aujourd’hui' },
  active: { title: 'Aucune location en cours' },
  all: { title: 'Aucune réservation trouvée' },
}

const COLUMNS = [
  {
    key: 'reference',
    header: 'Réservation',
    render: (row) => (
      <span className="flex flex-col items-start gap-1">
        <Link
          to={`/admin/reservations/${row.reference}`}
          onClick={(event) => event.stopPropagation()}
          className="link-underline touch-target font-semibold tabular-nums"
        >
          {row.reference}
        </Link>
        <StatusBadge status={row.status} />
      </span>
    ),
  },
  {
    key: 'client',
    header: 'Client',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium">{row.client?.name}</span>
        <span className="text-xs text-fg-subtle tabular-nums">
          {formatPhone(row.client?.phone)}
        </span>
      </span>
    ),
  },
  {
    key: 'car',
    header: 'Voiture',
    render: (row) => (
      <span className="flex items-center gap-3">
        <CarThumb src={row.car?.thumbnail_url} className="hidden w-14 2xl:grid" />
        <span className="flex flex-col">
          <span className="font-medium">{row.car?.name}</span>
          <span className="text-xs text-fg-subtle tabular-nums">{row.car?.plate_number}</span>
        </span>
      </span>
    ),
  },
  {
    key: 'dates',
    header: 'Période',
    render: (row) => (
      <span className="flex flex-col tabular-nums">
        <span>{formatShortDateTime(row.start_at)}</span>
        <span className="text-xs text-fg-subtle">jusqu’au {formatShortDateTime(row.end_at)}</span>
      </span>
    ),
  },
  {
    key: 'agency',
    header: 'Agence',
    className: 'min-w-36 whitespace-normal',
    render: (row) => (
      <span className="flex flex-col">
        <span>{row.pickup_location?.name}</span>
        {row.return_location?.id !== row.pickup_location?.id && (
          <span className="text-xs text-fg-subtle">retour : {row.return_location?.name}</span>
        )}
      </span>
    ),
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => <span className="font-semibold tabular-nums">{formatPrice(row.total)}</span>,
  },
]

/** /admin/reservations: tabs with counts, filters in the URL, table or cards, CSV export. */
export default function AdminReservationsPage() {
  usePageMeta('Réservations')
  const navigate = useNavigate()
  const { filters, setFilters, resetFilters } = useUrlFilters(RESERVATION_FILTERS)
  const params = useMemo(() => filtersToApiParams(filters, RESERVATION_FILTERS), [filters])
  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useAdminReservations(params)
  const { data: locations = [] } = useSettings('locations')
  const { data: cars } = useAdminCars({ per_page: 100, deleted: 'with' })
  const [exporting, setExporting] = useState(false)

  const activeCount = countActiveFilters(filters, RESERVATION_FILTERS, [
    'tab',
    'sort',
    'direction',
    'page',
  ])
  const sortValue = filters.sort ? `${filters.sort}:${filters.direction || 'asc'}` : ''

  async function handleExport() {
    setExporting(true)
    try {
      const { blob, filename } = await exportReservations({ ...params, page: undefined })
      downloadBlob(blob, filename)
      toast.success('Export CSV téléchargé')
    } catch (exportError) {
      toast.error('L’export a échoué', { description: apiErrorMessage(exportError) })
    } finally {
      setExporting(false)
    }
  }

  const list = (
    <ReservationList
      data={data}
      isPending={isPending}
      isError={isError}
      error={error}
      refetch={refetch}
      dimmed={isPlaceholderData}
      tab={filters.tab}
      hasFilters={activeCount > 0}
      onReset={() => resetFilters({ tab: filters.tab })}
      onOpen={(row) => navigate(`/admin/reservations/${row.reference}`)}
      onPage={(page) => setFilters({ page })}
    />
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Réservations"
        actions={
          <Button
            variant="secondary"
            leftIcon={Download}
            loading={exporting}
            onClick={handleExport}
          >
            Exporter en CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <SearchField
          label="Rechercher une réservation"
          placeholder="Référence, nom, e-mail ou téléphone"
          value={filters.q}
          onChange={(q) => setFilters({ q }, { replace: true })}
          className="w-full md:max-w-md"
        />
        <FilterPanel activeCount={activeCount} onReset={() => resetFilters({ tab: filters.tab })}>
          <Select
            label="Statut"
            className="md:w-44"
            options={[{ value: '', label: 'Tous les statuts' }, ...toOptions(RESERVATION_STATUS)]}
            value={filters.status[0] ?? ''}
            onChange={(status) => setFilters({ status: status ? [status] : [] })}
          />
          <Select
            label="Agence"
            className="md:w-52"
            options={[
              { value: '', label: 'Toutes les agences' },
              ...locations.map((location) => ({
                value: String(location.id),
                label: location.name,
              })),
            ]}
            value={filters.location}
            onChange={(location) => setFilters({ location })}
          />
          <Select
            label="Voiture"
            className="md:w-52"
            options={[
              { value: '', label: 'Toutes les voitures' },
              ...(cars?.data ?? []).map((car) => ({
                value: String(car.id),
                label: `${car.name} ${car.year} (${car.plate_number})`,
              })),
            ]}
            value={filters.car}
            onChange={(car) => setFilters({ car })}
          />
          <Input
            label="Du"
            type="date"
            className="md:w-40"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => setFilters({ from: event.target.value })}
          />
          <Input
            label="Au"
            type="date"
            className="md:w-40"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => setFilters({ to: event.target.value })}
          />
          <Select
            label="Trier par"
            className="md:w-52"
            options={SORTS}
            value={sortValue}
            onChange={(value) => {
              const [sort = '', direction = ''] = value.split(':')
              setFilters({ sort, direction })
            }}
          />
        </FilterPanel>
      </div>

      <Tabs
        label="Onglets des réservations"
        selectedIndex={TABS.indexOf(filters.tab)}
        onChange={(index) => setFilters({ tab: TABS[index] })}
        tabs={TABS.map((tab) => ({
          label: ADMIN_RESERVATION_TAB[tab],
          count: data?.meta?.counts?.[tab],
          content: list,
        }))}
      />
    </div>
  )
}

function ReservationList({
  data,
  isPending,
  isError,
  error,
  refetch,
  dimmed,
  tab,
  hasFilters,
  onReset,
  onOpen,
  onPage,
}) {
  if (isError) {
    return (
      <ErrorState title="Impossible de charger les réservations" error={error} onRetry={refetch} />
    )
  }

  if (!isPending && data.data.length === 0) {
    const empty = hasFilters ? EMPTY.all : EMPTY[tab]
    return (
      <EmptyState
        icon={CalendarX}
        title={empty.title}
        action={
          hasFilters && (
            <Button variant="secondary" onClick={onReset}>
              Effacer les filtres
            </Button>
          )
        }
      />
    )
  }

  return (
    <div
      className={cn('flex flex-col gap-6 transition-opacity duration-150', dimmed && 'opacity-60')}
      aria-busy={dimmed}
    >
      <Table
        caption="Réservations"
        columns={COLUMNS}
        rows={data?.data ?? []}
        rowKey="reference"
        loading={isPending}
        onRowClick={onOpen}
      />
      {data?.meta && (
        <div className="flex flex-col items-center gap-2">
          <Pagination
            page={data.meta.current_page}
            lastPage={data.meta.last_page}
            onPageChange={onPage}
          />
          <p className="text-sm text-fg-subtle tabular-nums">
            {data.meta.total} réservation{data.meta.total > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
