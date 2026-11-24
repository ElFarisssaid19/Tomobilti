import { useState } from 'react'
import { MIN_REASON_LENGTH } from '../../lib/adminReservations.js'
import { Button, Modal, Textarea } from '../ui'

export const REASON_REQUIRED = 'Indiquez le motif : il sera affiché au client.'

/**
 * Asks for the reason of a refusal or a cancellation before sending it. The reason is
 * required (3 characters at least, like the server) and the customer sees it.
 * Server 422 errors (`errors`) show under the field.
 */
export default function ReasonDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  label = 'Motif',
  placeholder,
  confirmLabel,
  tone = 'danger',
  loading = false,
  errors,
}) {
  const [reason, setReason] = useState('')
  const [clientError, setClientError] = useState(null)

  function close() {
    if (loading) return
    setReason('')
    setClientError(null)
    onClose()
  }

  function submit(event) {
    event.preventDefault()
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setClientError(REASON_REQUIRED)
      event.currentTarget.querySelector('textarea')?.focus()
      return
    }
    setClientError(null)
    onSubmit(reason.trim())
  }

  return (
    <Modal open={open} onClose={close} title={title} description={description} size="md" hideClose>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Textarea
          label={label}
          name="reason"
          required
          rows={3}
          maxLength={500}
          value={reason}
          placeholder={placeholder}
          onChange={(event) => {
            setReason(event.target.value)
            if (clientError && event.target.value.trim().length >= MIN_REASON_LENGTH)
              setClientError(null)
          }}
          error={clientError}
          errors={clientError ? undefined : errors}
          autoFocus
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close} disabled={loading}>
            Retour
          </Button>
          <Button
            type="submit"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
