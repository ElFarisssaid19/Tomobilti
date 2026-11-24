import { BadgeCheck, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import FilterPanel from '../../components/admin/FilterPanel.jsx'
import SearchField from '../../components/admin/SearchField.jsx'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  Table,
} from '../../components/ui'
import { useAdminClients } from '../../hooks/useAdmin.js'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { formatShortDate } from '../../lib/adminFormat.js'
import { CLIENT_FILTERS } from '../../lib/adminClients.js'
import { cn } from '../../lib/cn.js'
import { countActiveFilters, filtersToApiParams } from '../../lib/urlFilters.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

const SORTS = [
  { value: '', label: 'Inscrits récemment' },
  { value: 'name:asc', label: 'Nom, de A à Z' },
  { value: 'reservations_count:desc', label: 'Plus de réservations' },
  { value: 'reservations_sum_total:desc', label: 'Plus gros clients' },
]

function AccountBadges({ client }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {client.is_active ? (
        <Badge tone="success" dot>
          Actif
        </Badge>
      ) : (
        <Badge tone="danger" dot>
          Désactivé
        </Badge>
      )}
      {!client.is_verified && <Badge tone="warning">E-mail non vérifié</Badge>}
    </span>
  )
}

const COLUMNS = [
  {
    key: 'name',
    header: 'Client',
    render: (client) => (
      <span className="flex items-center gap-3">
        <Avatar name={client.name} size="sm" decorative />
        <span className="flex flex-col">
          <Link
            to={`/admin/clients/${client.id}`}
            onClick={(event) => event.stopPropagation()}
            className="link-underline font-semibold"
          >
            {client.name}
          </Link>
          <span className="flex items-center gap-1 text-xs text-fg-subtle">
            {client.email}
            {client.is_verified && (
              <BadgeCheck className="size-3.5 text-success" aria-label="E-mail vérifié" />
            )}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: 'phone',
    header: 'Téléphone',
    render: (client) => <span className="tabular-nums">{client.phone ?? '—'}</span>,
  },
  { key: 'city', header: 'Ville', render: (client) => client.city ?? '—' },
  {
    key: 'reservations',
    header: 'Réservations',
    align: 'right',
    render: (client) => (
      <span className="tabular-nums">{formatNumber(client.reservations_count)}</span>
    ),
  },
  {
    key: 'spent',
    header: 'Total dépensé',
    align: 'right',
    render: (client) => (
      <span className="font-semibold tabular-nums">{formatPrice(client.total_spent)}</span>
    ),
  },
  {
    key: 'created_at',
    header: 'Inscrit le',
    render: (client) => <span className="tabular-nums">{formatShortDate(client.created_at)}</span>,
  },
  { key: 'status', header: 'Compte', render: (client) => <AccountBadges client={client} /> },
]

/** /admin/clients */
export default function AdminClientsPage() {
  usePageMeta('Clients')
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { filters, setFilters, resetFilters } = useUrlFilters(CLIENT_FILTERS)
  const params = useMemo(() => filtersToApiParams(filters, CLIENT_FILTERS), [filters])
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminClients(params)
  const activeCount = countActiveFilters(filters, CLIENT_FILTERS, [
    'q',
    'sort',
    'direction',
    'page',
  ])
  const sortValue = filters.sort ? `${filters.sort}:${filters.direction || 'asc'}` : ''

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description="Les comptes clients, leurs réservations et leur total dépensé."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SearchField
          label="Rechercher un client"
          placeholder="Nom, e-mail ou téléphone"
          value={filters.q}
          onChange={(q) => setFilters({ q }, { replace: true })}
          className="w-full lg:max-w-sm"
        />
        <FilterPanel activeCount={activeCount} onReset={() => resetFilters()}>
          <Select
            label="Compte"
            className="md:w-40"
            options={[
              { value: '', label: 'Tous' },
              { value: '1', label: 'Actifs' },
              { value: '0', label: 'Désactivés' },
            ]}
            value={filters.active}
            onChange={(active) => setFilters({ active })}
          />
          <Select
            label="E-mail"
            className="md:w-40"
            options={[
              { value: '', label: 'Tous' },
              { value: '1', label: 'Vérifiés' },
              { value: '0', label: 'Non vérifiés' },
            ]}
            value={filters.verified}
            onChange={(verified) => setFilters({ verified })}
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
        <ErrorState title="Impossible de charger les clients" error={error} onRetry={refetch} />
      ) : !isPending && data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          text="Aucun compte ne correspond à cette recherche."
          action={
            <Button variant="secondary" onClick={() => resetFilters()}>
              Effacer les filtres
            </Button>
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
          {isDesktop ? (
            <Table
              caption="Clients"
              columns={COLUMNS}
              rows={data?.data ?? []}
              loading={isPending}
              onRowClick={(client) => navigate(`/admin/clients/${client.id}`)}
            />
          ) : isPending ? (
            <LoadingRegion label="Chargement des clients…" className="flex flex-col gap-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-24 w-full rounded-card" />
              ))}
            </LoadingRegion>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.data.map((client) => (
                <li key={client.id}>
                  <Link
                    to={`/admin/clients/${client.id}`}
                    className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 hover:border-line-strong"
                  >
                    <Avatar name={client.name} size="sm" decorative />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="truncate font-semibold text-fg">{client.name}</span>
                      <span className="truncate text-sm text-fg-muted">{client.email}</span>
                      <span className="text-sm text-fg-muted tabular-nums">
                        {formatNumber(client.reservations_count)} réservation
                        {client.reservations_count > 1 ? 's' : ''},{' '}
                        {formatPrice(client.total_spent)}
                      </span>
                      <AccountBadges client={client} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data?.meta && (
            <div className="flex flex-col items-center gap-2">
              <Pagination
                page={data.meta.current_page}
                lastPage={data.meta.last_page}
                onPageChange={(page) => setFilters({ page })}
              />
              <p className="text-sm text-fg-subtle tabular-nums">
                {data.meta.total} client{data.meta.total > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
