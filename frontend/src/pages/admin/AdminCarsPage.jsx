import {
  CarFront,
  Ellipsis,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import CarStatusBadge from '../../components/admin/CarStatusBadge.jsx'
import CarStatusDialog from '../../components/admin/CarStatusDialog.jsx'
import CarThumb from '../../components/admin/CarThumb.jsx'
import FilterPanel from '../../components/admin/FilterPanel.jsx'
import SearchField from '../../components/admin/SearchField.jsx'
import {
  Badge,
  Button,
  ConfirmDialog,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  PageHeader,
  Pagination,
  Select,
  Table,
} from '../../components/ui'
import { useAdminCars, useDeleteCar, useRestoreCar, useSettings } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { CAR_FILTERS } from '../../lib/adminCars.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { CAR_STATUS, toOptions } from '../../lib/labels.js'
import { countActiveFilters, filtersToApiParams } from '../../lib/urlFilters.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

const SORTS = [
  { value: '', label: 'Marque et modèle' },
  { value: 'price_per_day:asc', label: 'Prix croissant' },
  { value: 'price_per_day:desc', label: 'Prix décroissant' },
  { value: 'year:desc', label: 'Plus récentes' },
  { value: 'mileage:desc', label: 'Kilométrage décroissant' },
  { value: 'created_at:desc', label: 'Ajoutées récemment' },
]

/** /admin/voitures: the fleet, with search, filters, status and actions. */
export default function AdminCarsPage() {
  usePageMeta('Voitures')
  const navigate = useNavigate()
  const { filters, setFilters, resetFilters } = useUrlFilters(CAR_FILTERS)
  const params = useMemo(() => filtersToApiParams(filters, CAR_FILTERS), [filters])
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminCars(params)
  const { data: brands = [] } = useSettings('brands')
  const { data: categories = [] } = useSettings('categories')
  const { data: locations = [] } = useSettings('locations')
  const [statusCar, setStatusCar] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const deleteCar = useDeleteCar()
  const restoreCar = useRestoreCar()

  const activeCount = countActiveFilters(filters, CAR_FILTERS, ['q', 'sort', 'direction', 'page'])
  const sortValue =
    filters.sort && filters.sort !== 'name' ? `${filters.sort}:${filters.direction || 'asc'}` : ''
  const idOptions = (items, all) => [
    { value: '', label: all },
    ...items.map((item) => ({ value: String(item.id), label: item.name })),
  ]

  function actions(car) {
    if (car.is_deleted) {
      return [
        {
          label: 'Remettre dans la flotte',
          icon: RotateCcw,
          onClick: () =>
            restoreCar.mutate(car.id, {
              onSuccess: ({ message }) => toast.success(message),
              onError: (restoreError) =>
                toast.error('La restauration a échoué', {
                  description: apiErrorMessage(restoreError),
                }),
            }),
        },
      ]
    }
    return [
      { label: 'Modifier', icon: Pencil, to: `/admin/voitures/${car.id}` },
      { label: 'Changer le statut', icon: RefreshCcw, onClick: () => setStatusCar(car) },
      ...(car.status === 'available'
        ? [{ label: 'Voir sur le site', icon: ExternalLink, to: `/voitures/${car.slug}` }]
        : []),
      { divider: true },
      {
        label: 'Retirer de la flotte',
        icon: Trash2,
        danger: true,
        onClick: () => setDeleting(car),
      },
    ]
  }

  const columns = [
    {
      key: 'name',
      header: 'Voiture',
      render: (car) => (
        <span className="flex items-center gap-3">
          <CarThumb src={car.primary_image?.thumbnail_url} />
          <span className="flex flex-col">
            <Link
              to={`/admin/voitures/${car.id}`}
              onClick={(event) => event.stopPropagation()}
              className="link-underline touch-target font-semibold"
            >
              {car.name} {car.year}
            </Link>
            <span className="text-xs text-fg-subtle">{car.category?.name}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'plate_number',
      header: 'Immatriculation',
      render: (car) => <span className="tabular-nums">{car.plate_number}</span>,
    },
    { key: 'location', header: 'Agence', render: (car) => car.location?.name },
    {
      key: 'price',
      header: 'Prix / jour',
      align: 'right',
      render: (car) => (
        <span className="font-semibold tabular-nums">{formatPrice(car.price_per_day)}</span>
      ),
    },
    {
      key: 'mileage',
      header: 'Kilométrage',
      align: 'right',
      render: (car) => <span className="tabular-nums">{formatNumber(car.mileage)} km</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      card: 'status',
      render: (car) => (
        <span className="flex flex-wrap gap-1.5">
          {car.is_deleted ? (
            <Badge tone="neutral" icon={Trash2}>
              Retirée
            </Badge>
          ) : (
            <CarStatusBadge status={car.status} />
          )}
          {car.is_featured && !car.is_deleted && <Badge tone="lime">À la une</Badge>}
        </span>
      ),
    },
    {
      key: 'upcoming',
      header: 'Réservations à venir',
      align: 'right',
      render: (car) => <span className="tabular-nums">{car.upcoming_reservations_count}</span>,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      // Stays visible while a narrow screen scrolls the table sideways.
      className: 'sticky right-0 bg-surface',
      render: (car) => (
        <span onClick={(event) => event.stopPropagation()} className="inline-flex">
          <DropdownMenu
            trigger={
              <IconButton
                icon={Ellipsis}
                label={`Actions pour ${car.name} ${car.plate_number}`}
                size="sm"
                variant="ghost"
              />
            }
            items={actions(car)}
          />
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Voitures"
        actions={
          <Button to="/admin/voitures/nouvelle" leftIcon={Plus}>
            Ajouter une voiture
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <SearchField
          label="Rechercher une voiture"
          placeholder="Marque, modèle ou immatriculation"
          value={filters.q}
          onChange={(q) => setFilters({ q }, { replace: true })}
          className="w-full md:max-w-md"
        />
        <FilterPanel activeCount={activeCount} onReset={() => resetFilters()}>
          <Select
            label="Statut"
            className="md:w-44"
            options={[{ value: '', label: 'Tous les statuts' }, ...toOptions(CAR_STATUS)]}
            value={filters.status}
            onChange={(status) => setFilters({ status })}
          />
          <Select
            label="Catégorie"
            className="md:w-40"
            options={idOptions(categories, 'Toutes')}
            value={filters.category}
            onChange={(category) => setFilters({ category })}
          />
          <Select
            label="Marque"
            className="md:w-40"
            options={idOptions(brands, 'Toutes')}
            value={filters.brand}
            onChange={(brand) => setFilters({ brand })}
          />
          <Select
            label="Agence"
            className="md:w-52"
            options={idOptions(locations, 'Toutes les agences')}
            value={filters.location}
            onChange={(location) => setFilters({ location })}
          />
          <Select
            label="Voitures retirées"
            className="md:w-44"
            options={[
              { value: '', label: 'Masquées' },
              { value: 'with', label: 'Affichées' },
              { value: 'only', label: 'Seulement elles' },
            ]}
            value={filters.deleted}
            onChange={(deleted) => setFilters({ deleted })}
          />
          <Select
            label="Trier par"
            className="md:w-48"
            options={SORTS}
            value={sortValue}
            onChange={(value) => {
              const [sort = '', direction = ''] = value.split(':')
              setFilters({ sort, direction })
            }}
          />
        </FilterPanel>
      </div>

      {isError ? (
        <ErrorState title="Impossible de charger la flotte" error={error} onRetry={refetch} />
      ) : !isPending && data.data.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title={activeCount || filters.q ? 'Aucune voiture trouvée' : 'Aucune voiture'}
          action={
            activeCount || filters.q ? (
              <Button variant="secondary" onClick={() => resetFilters()}>
                Effacer les filtres
              </Button>
            ) : (
              <Button to="/admin/voitures/nouvelle" leftIcon={Plus}>
                Ajouter une voiture
              </Button>
            )
          }
        />
      ) : (
        <div
          className={cn(
            'flex flex-col gap-6 transition-opacity duration-150',
            isPlaceholderData && 'opacity-60',
          )}
          aria-busy={isPlaceholderData}
        >
          <Table
            caption="Flotte"
            columns={columns}
            rows={data?.data ?? []}
            loading={isPending}
            onRowClick={(car) => navigate(`/admin/voitures/${car.id}`)}
          />
          {data?.meta && (
            <div className="flex flex-col items-center gap-2">
              <Pagination
                page={data.meta.current_page}
                lastPage={data.meta.last_page}
                onPageChange={(page) => setFilters({ page })}
              />
              <p className="text-sm text-fg-subtle tabular-nums">
                {data.meta.total} voiture{data.meta.total > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {statusCar && (
        <CarStatusDialog
          key={statusCar.id}
          car={statusCar}
          open
          onClose={() => setStatusCar(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={deleteCar.isPending}
        tone="danger"
        title="Retirer cette voiture de la flotte ?"
        description={
          deleting
            ? `${deleting.name} ${deleting.year} (${deleting.plate_number}) disparaît du site. Son historique de réservations est conservé et vous pourrez la remettre dans la flotte.`
            : ''
        }
        confirmLabel="Retirer de la flotte"
        onConfirm={() =>
          deleteCar.mutate(deleting.id, {
            onSuccess: ({ message }) => {
              toast.success(message)
              setDeleting(null)
            },
            onError: (deleteError) => {
              toast.error('La voiture n’a pas été retirée', {
                description: apiErrorMessage(deleteError),
                duration: 8000,
              })
              setDeleting(null)
            },
          })
        }
      />
    </div>
  )
}
