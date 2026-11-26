import { useState } from 'react'
import { toast } from 'sonner'
import { useReservationAction } from '../../hooks/useAdmin.js'
import { actionsForStatus, RESERVATION_ACTIONS } from '../../lib/adminReservations.js'
import { apiErrorMessage, isValidationError } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { Button, ConfirmDialog } from '../ui'
import PaymentDialog from './PaymentDialog.jsx'
import ReasonDialog from './ReasonDialog.jsx'

/**
 * The buttons allowed by the reservation's status (Confirmer, Refuser, Marquer comme
 * récupérée, Marquer comme rendue, Annuler), each behind a confirmation; refusing and
 * cancelling ask for the reason, picking up asks how the customer pays (the invoice
 * is issued then). The server checks the move again: a refusal (403, 409) shows its
 * French reason in a toast.
 */
export default function ReservationActions({ reservation, size = 'md', className }) {
  const [current, setCurrent] = useState(null)
  const mutation = useReservationAction()
  const actions = actionsForStatus(reservation.status)
  const config = current ? RESERVATION_ACTIONS[current] : null

  if (actions.length === 0) return null

  function close() {
    if (!mutation.isPending) {
      setCurrent(null)
      mutation.reset()
    }
  }

  function run(body) {
    mutation.mutate(
      { reference: reservation.reference, action: current, body },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          setCurrent(null)
          mutation.reset()
        },
        onError: (error) => {
          if (isValidationError(error)) return
          toast.error(`${config.label} : action impossible`, {
            description: apiErrorMessage(error),
          })
          setCurrent(null)
        },
      },
    )
  }

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        {actions.map((key) => {
          const action = RESERVATION_ACTIONS[key]
          return (
            <Button
              key={key}
              size={size}
              variant={action.variant}
              leftIcon={action.icon}
              onClick={() => setCurrent(key)}
            >
              {action.label}
            </Button>
          )
        })}
      </div>

      <ConfirmDialog
        open={Boolean(config) && !config.reason && !config.payment}
        onClose={close}
        onConfirm={() => run()}
        loading={mutation.isPending}
        title={config?.title}
        description={config?.description}
        confirmLabel={config?.confirmLabel ?? config?.label}
      >
        <p className="text-sm text-fg-muted">
          Réservation{' '}
          <span className="font-semibold text-fg tabular-nums">{reservation.reference}</span>
        </p>
      </ConfirmDialog>

      <ReasonDialog
        key={current ?? 'none'}
        open={Boolean(config?.reason)}
        onClose={close}
        onSubmit={(reason) => run({ reason })}
        loading={mutation.isPending}
        errors={mutation.error}
        title={config?.title}
        description={config?.description}
        label={config?.reasonLabel}
        placeholder={config?.reasonPlaceholder}
        confirmLabel={config?.confirmLabel ?? config?.label}
        tone={config?.tone ?? 'primary'}
      />

      <PaymentDialog
        key={`payment-${current ?? 'none'}`}
        open={Boolean(config?.payment)}
        onClose={close}
        onSubmit={run}
        loading={mutation.isPending}
        errors={mutation.error}
        askPaidNow
        title={config?.title}
        description={config?.description}
        confirmLabel={config?.confirmLabel ?? config?.label}
      />
    </>
  )
}
