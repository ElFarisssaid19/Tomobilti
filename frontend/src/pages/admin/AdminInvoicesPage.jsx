import { Banknote, Clock, ReceiptText } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import FilterPanel from '../../components/admin/FilterPanel.jsx'
import InvoiceActions from '../../components/admin/InvoiceActions.jsx'
import InvoiceStatusBadge from '../../components/admin/InvoiceStatusBadge.jsx'
import SearchField from '../../components/admin/SearchField.jsx'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
  StatCard,
  Table,
} from '../../components/ui'
import { useAdminInvoices } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { formatShortDate } from '../../lib/adminFormat.js'
import { INVOICE_FILTERS } from '../../lib/adminInvoices.js'
import { cn } from '../../lib/cn.js'
import { INVOICE_STATUS, label, PAYMENT_METHOD, toOptions } from '../../lib/labels.js'
import { countActiveFilters, filtersToApiParams } from '../../lib/urlFilters.js'
import { formatPrice } from '../../utils/format.js'

const SORTS = [
  { value: '', label: 'Plus récentes' },
  { value: 'issued_at:asc', label: 'Plus anciennes' },
  { value: 'total_ttc:desc', label: 'Montant décroissant' },
  { value: 'number:asc', label: 'Numéro' },
]

const COLUMNS = [
  {
    key: 'number',
    header: 'Facture',
    render: (invoice) => (
      <span className="flex flex-col">
        <Link
          to={`/admin/reservations/${invoice.reservation.reference}`}
          onClick={(event) => event.stopPropagation()}
          className="link-underline touch-target font-semibold tabular-nums"
        >
          {invoice.number}
        </Link>
        <span className="text-xs text-fg-subtle tabular-nums">{invoice.reservation.reference}</span>
      </span>
    ),
  },
  {
    key: 'client',
    header: 'Client',
    render: (invoice) => (
      <span className="flex flex-col">
        <span className="font-semibold text-fg">{invoice.reservation.client?.name}</span>
        <span className="text-xs text-fg-subtle">{invoice.reservation.car?.name}</span>
      </span>
    ),
  },
  {
    key: 'issued_at',
    header: 'Émise le',
    render: (invoice) => <span className="tabular-nums">{formatShortDate(invoice.issued_at)}</span>,
  },
  {
    key: 'payment_method',
    header: 'Mode',
    render: (invoice) => label(PAYMENT_METHOD, invoice.payment_method) || '—',
  },
  {
    key: 'total_ttc',
    header: 'Total TTC',
    align: 'right',
    render: (invoice) => (
      <span className="font-semibold tabular-nums">{formatPrice(invoice.total_ttc)}</span>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    card: 'status',
    render: (invoice) => <InvoiceStatusBadge status={invoice.status} />,
  },
  {
    key: 'actions',
    header: <span className="sr-only">Actions</span>,
    align: 'right',
    // Stays visible while a narrow screen scrolls the table sideways.
    className: 'sticky right-0 bg-surface',
    render: (invoice) => (
      <span onClick={(event) => event.stopPropagation()} className="inline-flex">
        <InvoiceActions invoice={invoice} variant="menu" />
      </span>
    ),
  },
]

/** /admin/factures */
export default function AdminInvoicesPage() {
  usePageMeta('Factures')
  const navigate = useNavigate()
  const { filters, setFilters, resetFilters } = useUrlFilters(INVOICE_FILTERS)
  const params = useMemo(() => filtersToApiParams(filters, INVOICE_FILTERS), [filters])
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAdminInvoices(params)
  const activeCount = countActiveFilters(filters, INVOICE_FILTERS, [
    'q',
    'sort',
    'direction',
    'page',
  ])
  const sortValue = filters.sort ? `${filters.sort}:${filters.direction || 'asc'}` : ''
  const totals = data?.meta?.totals

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Factures" />

      <div
        className={cn(
          'grid gap-4 transition-opacity duration-150 sm:grid-cols-2',
          isPlaceholderData && 'opacity-60',
        )}
      >
        {totals ? (
          <>
            <StatCard
              icon={Banknote}
              label="Encaissé"
              value={Number(totals.paid)}
              format="amount"
            />
            <StatCard
              icon={Clock}
              label="À encaisser"
              value={Number(totals.unpaid)}
              format="amount"
            />
          </>
        ) : (
          <>
            <Skeleton className="h-36 rounded-card" />
            <Skeleton className="h-36 rounded-card" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <SearchField
          label="Rechercher une facture"
          placeholder="Numéro, référence, client"
          value={filters.q}
          onChange={(q) => setFilters({ q }, { replace: true })}
          className="w-full md:max-w-md"
        />
        <FilterPanel activeCount={activeCount} onReset={() => resetFilters()}>
          <Select
            label="Statut"
            className="md:w-40"
            options={[{ value: '', label: 'Tous' }, ...toOptions(INVOICE_STATUS)]}
            value={filters.status}
            onChange={(status) => setFilters({ status })}
          />
          <Select
            label="Mode de paiement"
            className="md:w-48"
            options={[{ value: '', label: 'Tous' }, ...toOptions(PAYMENT_METHOD)]}
            value={filters.payment_method}
            onChange={(paymentMethod) => setFilters({ payment_method: paymentMethod })}
          />
          <Input
            label="Émise du"
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
        <ErrorState title="Impossible de charger les factures" error={error} onRetry={refetch} />
      ) : !isPending && data.data.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Aucune facture trouvée"
          action={
            activeCount > 0 || filters.q ? (
              <Button variant="secondary" onClick={() => resetFilters()}>
                Effacer les filtres
              </Button>
            ) : null
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
            caption="Factures"
            columns={COLUMNS}
            rows={data?.data ?? []}
            rowKey="number"
            loading={isPending}
            onRowClick={(invoice) =>
              navigate(`/admin/reservations/${invoice.reservation.reference}`)
            }
          />
          {data?.meta && (
            <div className="flex flex-col items-center gap-2">
              <Pagination
                page={data.meta.current_page}
                lastPage={data.meta.last_page}
                onPageChange={(page) => setFilters({ page })}
              />
              <p className="text-sm text-fg-subtle tabular-nums">
                {data.meta.total} facture{data.meta.total > 1 ? 's' : ''}
                {totals && `, ${formatPrice(totals.total)} TTC`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
