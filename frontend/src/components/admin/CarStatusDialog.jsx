import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useCarStatusConflicts, useChangeCarStatus } from '../../hooks/useAdmin.js'
import { formatShortDateTime } from '../../lib/adminFormat.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { CAR_STATUS, toOptions } from '../../lib/labels.js'
import { Alert, Button, Modal, RadioGroup, Skeleton, StatusBadge } from '../ui'

/**
 * Change a car's status. Before confirming, the pending and confirmed reservations
 * that are not over yet are listed: a car in maintenance or out of service leaves the
 * catalogue and cannot be confirmed, so the agency should call those customers.
 */
export default function CarStatusDialog({ car, open, onClose }) {
  const [status, setStatus] = useState(car.status === 'available' ? 'maintenance' : 'available')
  const leaving = status !== 'available'
  const conflicts = useCarStatusConflicts(car.id, open && leaving)
  const change = useChangeCarStatus()
  const affected = leaving ? (conflicts.data ?? []) : []

  function close() {
    if (!change.isPending) onClose()
  }

  function confirm() {
    change.mutate(
      { id: car.id, status, force: affected.length > 0 },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          onClose()
        },
        onError: (error) =>
          toast.error('Le statut n’a pas changé', { description: apiErrorMessage(error) }),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Changer le statut"
      description={`${car.name} ${car.year}, ${car.plate_number}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={change.isPending}>
            Retour
          </Button>
          <Button
            onClick={confirm}
            loading={change.isPending}
            disabled={status === car.status || (leaving && conflicts.isPending)}
            variant={affected.length > 0 ? 'danger' : 'primary'}
          >
            {affected.length > 0 ? 'Changer quand même' : 'Changer le statut'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <RadioGroup
          label="Nouveau statut"
          value={status}
          onChange={setStatus}
          options={toOptions(CAR_STATUS).map((option) => ({
            ...option,
            disabled: option.value === car.status,
            description:
              option.value === car.status
                ? 'Statut actuel'
                : option.value === 'available'
                  ? 'Visible sur le site et réservable.'
                  : 'Retirée du site : plus aucune réservation possible.',
          }))}
        />

        {leaving && conflicts.isPending && <Skeleton className="h-20 w-full rounded-input" />}
        {leaving && conflicts.isError && (
          <Alert tone="danger">{apiErrorMessage(conflicts.error)}</Alert>
        )}
        {leaving && conflicts.data && affected.length === 0 && (
          <Alert tone="success">Aucune réservation à venir ne concerne cette voiture.</Alert>
        )}
        {affected.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 text-sm font-semibold text-warning">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {affected.length > 1
                ? `${affected.length} réservations à venir ou en cours concernent cette voiture. Elles ne sont pas annulées : prévenez les clients.`
                : 'Une réservation à venir ou en cours concerne cette voiture. Elle n’est pas annulée : prévenez le client.'}
            </p>
            <ul className="flex max-h-60 flex-col divide-y divide-line overflow-y-auto rounded-input border border-line">
              {affected.map((reservation) => (
                <li
                  key={reservation.reference}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 flex-col">
                    <Link
                      to={`/admin/reservations/${reservation.reference}`}
                      className="link-underline self-start font-semibold text-fg tabular-nums"
                    >
                      {reservation.reference}
                    </Link>
                    <span className="truncate text-fg-muted">
                      {reservation.client?.name}, {formatShortDateTime(reservation.start_at)} –{' '}
                      {formatShortDateTime(reservation.end_at)}
                    </span>
                  </span>
                  <StatusBadge status={reservation.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
