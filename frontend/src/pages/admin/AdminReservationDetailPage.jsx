import { CalendarX, FileDown, IdCard, Mail, Phone, Save } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { downloadAdminVoucher } from '../../api/admin.js'
import CarThumb from '../../components/admin/CarThumb.jsx'
import InvoiceActions from '../../components/admin/InvoiceActions.jsx'
import InvoiceStatusBadge from '../../components/admin/InvoiceStatusBadge.jsx'
import ReservationActions from '../../components/admin/ReservationActions.jsx'
import StatusHistory from '../../components/admin/StatusHistory.jsx'
import { actionsForStatus } from '../../lib/adminReservations.js'
import PriceBreakdown from '../../components/reservation/PriceBreakdown.jsx'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui'
import { useAdminReservation, useSaveReservationNotes } from '../../hooks/useAdmin.js'
import useDownload from '../../hooks/useDownload.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { formatShortDate } from '../../lib/adminFormat.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { formatDays } from '../../lib/dates.js'
import { label, PAYMENT_METHOD } from '../../lib/labels.js'
import { formatDate, formatPrice } from '../../utils/format.js'

const WHEN = {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/** /admin/reservations/:reference */
export default function AdminReservationDetailPage() {
  const { reference } = useParams()
  usePageMeta(`Réservation ${reference}`)
  const { data: reservation, isPending, isError, error, refetch } = useAdminReservation(reference)

  if (isPending) {
    return (
      <LoadingRegion label="Chargement de la réservation…" className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72 rounded-input" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-card-lg" />
          <Skeleton className="h-96 rounded-card-lg" />
        </div>
      </LoadingRegion>
    )
  }

  if (isError) {
    if (error?.response?.status === 404) {
      return (
        <EmptyState
          icon={CalendarX}
          title="Réservation introuvable"
          text={`Aucune réservation ne porte la référence ${reference}.`}
          action={<Button to="/admin/reservations">Voir les réservations</Button>}
        />
      )
    }
    return (
      <ErrorState title="Impossible de charger la réservation" error={error} onRetry={refetch} />
    )
  }

  const { client, car } = reservation
  const reason = reservation.rejection_reason || reservation.cancellation_reason

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Réservations', to: '/admin/reservations' },
          { label: reservation.reference },
        ]}
        title={reservation.reference}
        description={`Demandée le ${formatShortDate(reservation.created_at)}`}
        actions={<StatusBadge status={reservation.status} size="md" />}
      />

      {(reservation.has_voucher || actionsAvailable(reservation.status)) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ReservationActions reservation={reservation} />
          {reservation.has_voucher && <VoucherButton reference={reservation.reference} />}
        </div>
      )}

      {reason && (
        <Alert
          tone={reservation.status === 'rejected' ? 'danger' : 'info'}
          title={reservation.status === 'rejected' ? 'Motif du refus' : 'Motif de l’annulation'}
        >
          {reason}
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card padding="lg" className="flex flex-col gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Handover
                title="Départ"
                at={reservation.start_at}
                location={reservation.pickup_location}
              />
              <Handover
                title="Retour"
                at={reservation.end_at}
                location={reservation.return_location}
              />
            </div>
            <p className="text-sm text-fg-muted">
              {formatDays(reservation.days)} facturés
              {reservation.pickup_location?.id !== reservation.return_location?.id &&
                ', retour dans une autre agence'}
            </p>
          </Card>

          <Card padding="lg" className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-fg">Prix</h2>
            <PriceBreakdown pricing={reservation.pricing} />
          </Card>

          {reservation.invoice && <InvoiceCard invoice={reservation.invoice} />}

          <Card padding="lg" className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-fg">Notes</h2>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-fg">Message du client</p>
              <p className="text-sm text-fg-muted">
                {reservation.customer_notes || 'Aucun message.'}
              </p>
            </div>
            <AdminNotes key={reservation.admin_notes ?? ''} reservation={reservation} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-fg">Client</h2>
              {!client.is_active && <Badge tone="danger">Compte désactivé</Badge>}
            </div>
            <Link
              to={`/admin/clients/${client.id}`}
              className="link-underline self-start text-base font-semibold text-fg"
            >
              {client.name}
            </Link>
            <ul className="flex flex-col gap-2 text-sm text-fg-muted">
              <ContactLine icon={Mail} href={`mailto:${client.email}`}>
                {client.email}
              </ContactLine>
              {client.phone && (
                <ContactLine icon={Phone} href={`tel:${client.phone}`}>
                  {client.phone}
                </ContactLine>
              )}
              {client.cin && <ContactLine icon={IdCard}>CIN {client.cin}</ContactLine>}
              {client.driving_license_number && (
                <ContactLine icon={IdCard}>
                  Permis {client.driving_license_number}
                  {client.driving_license_issued_at &&
                    `, depuis le ${formatShortDate(client.driving_license_issued_at)}`}
                </ContactLine>
              )}
            </ul>
          </Card>

          <Card padding="md" className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-fg">Voiture</h2>
            <div className="flex items-center gap-3">
              <CarThumb src={car.thumbnail_url} className="w-20" />
              <div className="flex min-w-0 flex-col">
                <Link
                  to={`/admin/voitures/${car.id}`}
                  className="link-underline self-start font-semibold text-fg"
                >
                  {car.name} {car.year}
                </Link>
                <span className="text-sm text-fg-muted tabular-nums">{car.plate_number}</span>
                {car.is_deleted && (
                  <span className="text-sm text-warning">Retirée de la flotte</span>
                )}
              </div>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-fg">Historique</h2>
            <StatusHistory history={reservation.history} />
          </Card>
        </div>
      </div>
    </div>
  )
}

/** The status allows at least one action (see actionsForStatus). */
function actionsAvailable(status) {
  return actionsForStatus(status).length > 0
}

function VoucherButton({ reference }) {
  const voucher = useDownload(downloadAdminVoucher)
  return (
    <Button
      variant="ghost"
      leftIcon={FileDown}
      loading={voucher.isPending}
      onClick={() => voucher.download(reference)}
    >
      Bon de réservation
    </Button>
  )
}

function InvoiceCard({ invoice }) {
  const rows = [
    ['Émise le', formatShortDate(invoice.issued_at)],
    ['Mode de paiement', label(PAYMENT_METHOD, invoice.payment_method) || '—'],
    invoice.paid_at && ['Payée le', formatShortDate(invoice.paid_at)],
    ['Total TTC', formatPrice(invoice.total_ttc)],
  ].filter(Boolean)

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-fg">
          Facture <span className="tabular-nums">{invoice.number}</span>
        </h2>
        <InvoiceStatusBadge status={invoice.status} />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {rows.map(([term, value]) => (
          <div key={term} className="flex flex-col gap-0.5">
            <dt className="text-fg-subtle">{term}</dt>
            <dd className="font-semibold text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <InvoiceActions invoice={invoice} />
    </Card>
  )
}

function Handover({ title, at, location }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-semibold text-fg-muted">{title}</p>
      <p className="text-lg font-bold text-fg tabular-nums">{formatDate(at, WHEN)}</p>
      <p className="text-sm text-fg">{location?.name}</p>
      {location?.phone && <p className="text-sm text-fg-muted tabular-nums">{location.phone}</p>}
    </div>
  )
}

function ContactLine({ icon: Icon, href, children }) {
  const content = (
    <>
      <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </>
  )
  return (
    <li>
      {href ? (
        <a href={href} className="flex items-center gap-2 hover:text-fg">
          {content}
        </a>
      ) : (
        <span className="flex items-center gap-2">{content}</span>
      )}
    </li>
  )
}

function AdminNotes({ reservation }) {
  const [notes, setNotes] = useState(reservation.admin_notes ?? '')
  const save = useSaveReservationNotes()
  const changed = notes !== (reservation.admin_notes ?? '')

  function submit(event) {
    event.preventDefault()
    save.mutate(
      { reference: reservation.reference, notes },
      {
        onSuccess: ({ message }) => toast.success(message),
        onError: (error) =>
          toast.error('L’enregistrement a échoué', { description: apiErrorMessage(error) }),
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Textarea
        label="Notes internes"
        hint="Visibles par l’agence uniquement."
        name="admin_notes"
        rows={3}
        maxLength={2000}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        errors={save.error}
      />
      <Button
        type="submit"
        variant="secondary"
        leftIcon={Save}
        disabled={!changed}
        loading={save.isPending}
        className="self-start"
      >
        Enregistrer les notes
      </Button>
    </form>
  )
}
