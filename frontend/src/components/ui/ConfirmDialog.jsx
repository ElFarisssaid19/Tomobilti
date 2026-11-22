import Button from './Button.jsx'
import Modal from './Modal.jsx'

/**
 * Confirmation before an action. The confirm button names the action ("Annuler la
 * réservation"), never a vague "OK". `tone="danger"` for destructive actions.
 *
 * @example
 * <ConfirmDialog
 *   open={open} onClose={close} onConfirm={cancelReservation} loading={isCancelling}
 *   title="Annuler cette réservation ?" description="La voiture sera remise en location."
 *   confirmLabel="Annuler la réservation" tone="danger"
 * />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Retour',
  tone = 'primary',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      hideClose
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
