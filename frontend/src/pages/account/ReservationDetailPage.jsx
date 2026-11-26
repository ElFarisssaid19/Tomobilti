import { ArrowLeft, CalendarX2, FileDown, ReceiptText, SearchX } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import AgencyDetails from '../../components/reservation/AgencyDetails.jsx'
import DocumentsToBring from '../../components/reservation/DocumentsToBring.jsx'
import PriceBreakdown from '../../components/reservation/PriceBreakdown.jsx'
import RentalTerms from '../../components/reservation/RentalTerms.jsx'
import ReservationTimeline from '../../components/reservation/ReservationTimeline.jsx'
import {
  Alert,
  Button,
  CarImage,
  CarSpecs,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui'
import { downloadInvoice, downloadVoucher } from '../../api/reservations.js'
import useDownload from '../../hooks/useDownload.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { useCancelReservation, useReservation } from '../../hooks/useReservations.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { formatMoment } from '../../lib/booking.js'
import { formatDate } from '../../utils/format.js'

/**
 * /espace/reservations/:reference: status timeline, car, dates and agencies, options,
 * price breakdown, deposit, documents to bring, and free cancellation when allowed
 * (otherwise the reason it is not). Someone else's reference answers 404.
 */
export default function ReservationDetailPage() {
  const { reference } = useParams()
  const { data: reservation, isPending, isError, error, refetch } = useReservation(reference)

  usePageMeta(`Réservation ${reference}`, 'Le détail de votre réservation Tomobilti.')

  if (isPending) return <DetailSkeleton />

  if (isError) {
    return error?.response?.status === 404 ? (
      <EmptyState
        icon={SearchX}
        title="Réservation introuvable"
        text="Cette référence ne correspond à aucune de vos réservations."
        action={<Button to="/espace/reservations">Mes réservations</Button>}
      />
    ) : (
      <ErrorState title="Impossible de charger la réservation" error={error} onRetry={refetch} />
    )
  }

  return <ReservationDetail reservation={reservation} />
}

function ReservationDetail({ reservation }) {
  const { car, pricing } = reservation
  const isOver = ['completed', 'cancelled', 'rejected'].includes(reservation.status)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Button
          to="/espace/reservations"
          variant="link"
          leftIcon={ArrowLeft}
          className="self-start"
        >
          Mes réservations
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={reservation.status} size="md" />
              <span className="text-sm text-fg-muted tabular-nums">{reservation.reference}</span>
            </div>
            <h2 className="text-3xl font-bold text-fg sm:text-4xl">{car.name}</h2>
          </div>
          <DocumentButtons reservation={reservation} />
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-4 sm:flex-row sm:items-center sm:p-5">
            <CarImage
              car={car}
              zoom={false}
              sizes="(min-width: 640px) 240px, 100vw"
              className="aspect-[16/10] w-full shrink-0 rounded-card sm:w-60"
            />
            <div className="flex flex-col gap-3">
              <p className="text-lg font-bold text-fg">
                {car.name} {car.year}
              </p>
              <CarSpecs car={car} />
            </div>
          </section>

          <section aria-labelledby="dates-agences" className="flex flex-col gap-4">
            <h3 id="dates-agences" className="text-xl font-bold text-fg">
              Dates et agences
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <AgencyDetails
                caption="Prise en charge"
                when={formatMoment(reservation.start_at)}
                location={reservation.pickup_location}
              />
              <AgencyDetails
                caption="Restitution"
                when={formatMoment(reservation.end_at)}
                location={reservation.return_location}
              />
            </div>
          </section>

          {reservation.customer_notes && (
            <section aria-labelledby="remarques" className="flex flex-col gap-2">
              <h3 id="remarques" className="text-xl font-bold text-fg">
                Vos remarques
              </h3>
              <p className="text-fg-muted">{reservation.customer_notes}</p>
            </section>
          )}

          {!isOver && (
            <section aria-labelledby="documents" className="flex flex-col gap-4">
              <h3 id="documents" className="text-xl font-bold text-fg">
                Documents à présenter
              </h3>
              <DocumentsToBring />
            </section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="statut"
            className="flex flex-col gap-5 rounded-card-lg border border-line bg-surface p-5 sm:p-6"
          >
            <h3 id="statut" className="text-lg font-bold text-fg">
              Suivi
            </h3>
            <ReservationTimeline reservation={reservation} />
          </section>

          <section
            aria-labelledby="prix"
            className="flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-5 sm:p-6"
          >
            <h3 id="prix" className="text-lg font-bold text-fg">
              Prix
            </h3>
            <PriceBreakdown pricing={pricing} />
            <RentalTerms />
          </section>

          <Cancellation reservation={reservation} />
        </div>
      </div>
    </div>
  )
}

/**
 * The PDFs of the reservation: the booking voucher once the agency confirmed, the
 * invoice once issued at pick-up. Nothing before that.
 */
function DocumentButtons({ reservation }) {
  const voucher = useDownload(downloadVoucher)
  const invoice = useDownload(downloadInvoice)

  if (!reservation.has_voucher && !reservation.invoice) return null

  return (
    <div className="flex flex-wrap gap-2">
      {reservation.has_voucher && (
        <Button
          variant="secondary"
          leftIcon={FileDown}
          loading={voucher.isPending}
          onClick={() => voucher.download(reservation.reference)}
        >
          Télécharger le bon de réservation
        </Button>
      )}
      {reservation.invoice && (
        <Button
          variant="secondary"
          leftIcon={ReceiptText}
          loading={invoice.isPending}
          onClick={() => invoice.download(reservation.reference)}
        >
          Télécharger la facture
        </Button>
      )}
    </div>
  )
}

function Cancellation({ reservation }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useCancelReservation()
  const { allowed, reason: blockedReason, free_until: freeUntil } = reservation.cancellation

  if (['cancelled', 'rejected', 'completed'].includes(reservation.status)) return null

  function confirm() {
    cancel.mutate(
      { reference: reservation.reference, reason: reason.trim() },
      {
        onSuccess: () => {
          setOpen(false)
          toast.success('Réservation annulée')
        },
        onError: (error) => {
          toast.error('L’annulation n’a pas abouti', { description: apiErrorMessage(error) })
        },
      },
    )
  }

  return (
    <section
      aria-labelledby="annulation"
      className="flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-5 sm:p-6"
    >
      <h3 id="annulation" className="text-lg font-bold text-fg">
        Annulation
      </h3>
      {allowed ? (
        <>
          <p className="text-sm text-fg-muted">
            Gratuite jusqu’au{' '}
            <span className="font-semibold text-fg tabular-nums">
              {formatDate(freeUntil, { day: 'numeric', month: 'long' })} à{' '}
              {formatDate(freeUntil, { hour: '2-digit', minute: '2-digit' })}
            </span>
            , 24 h avant le départ.
          </p>
          <Button
            variant="danger"
            leftIcon={CalendarX2}
            onClick={() => setOpen(true)}
            className="self-start"
          >
            Annuler la réservation
          </Button>
        </>
      ) : (
        <Alert tone="info" title="Annulation en ligne impossible">
          {blockedReason}
        </Alert>
      )}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={cancel.isPending}
        tone="danger"
        title="Annuler cette réservation ?"
        description={`${reservation.car.name}, du ${formatMoment(reservation.start_at)}. La voiture sera remise en location.`}
        confirmLabel="Annuler la réservation"
        cancelLabel="Garder ma réservation"
      >
        <Textarea
          label="Motif (facultatif)"
          name="reason"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Changement de programme, vol annulé…"
        />
      </ConfirmDialog>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <LoadingRegion label="Chargement de la réservation…" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-72 max-w-full rounded-input" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
        <Skeleton className="h-80 rounded-card-lg" />
        <Skeleton className="h-96 rounded-card-lg" />
      </div>
    </LoadingRegion>
  )
}
