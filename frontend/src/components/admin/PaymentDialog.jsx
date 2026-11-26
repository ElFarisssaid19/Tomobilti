import { useState } from 'react'
import { PAYMENT_METHOD, toOptions } from '../../lib/labels.js'
import { Button, Modal, RadioGroup } from '../ui'

export const PAYMENT_METHOD_REQUIRED = 'Choisissez le mode de paiement.'

const WHEN_OPTIONS = [
  { value: 'now', label: 'Payé maintenant' },
  { value: 'later', label: 'Plus tard', description: 'La facture reste à encaisser.' },
]

/**
 * Asks how the customer pays at the agency: the payment method (espèces, carte,
 * virement) and, when `askPaidNow`, whether it is paid now or later. Used by
 * "Marquer comme récupérée" (which issues the invoice) and "Marquer comme payée".
 * `onSubmit({ payment_method, paid })`. Server 422 errors show under the fields.
 */
export default function PaymentDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  confirmLabel,
  askPaidNow = false,
  defaultMethod = '',
  loading = false,
  errors,
}) {
  const [method, setMethod] = useState(defaultMethod)
  const [when, setWhen] = useState('now')
  const [clientError, setClientError] = useState(null)

  function close() {
    if (loading) return
    setMethod(defaultMethod)
    setWhen('now')
    setClientError(null)
    onClose()
  }

  function submit(event) {
    event.preventDefault()
    if (!method) {
      setClientError(PAYMENT_METHOD_REQUIRED)
      event.currentTarget.querySelector('[role="radio"]')?.focus()
      return
    }
    setClientError(null)
    onSubmit(
      askPaidNow ? { payment_method: method, paid: when === 'now' } : { payment_method: method },
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      size="md"
      hideClose
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={loading}>
            Retour
          </Button>
          <Button type="submit" loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <RadioGroup
          label="Mode de paiement"
          name="payment_method"
          columns={3}
          options={toOptions(PAYMENT_METHOD)}
          value={method}
          onChange={(value) => {
            setMethod(value)
            setClientError(null)
          }}
          error={clientError}
          errors={clientError ? undefined : errors}
        />
        {askPaidNow && (
          <RadioGroup
            label="Paiement"
            name="paid"
            columns={2}
            options={WHEN_OPTIONS}
            value={when}
            onChange={setWhen}
            errors={errors}
          />
        )}
      </div>
    </Modal>
  )
}
