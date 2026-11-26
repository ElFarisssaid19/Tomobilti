import { CircleCheck, Ellipsis, FileDown, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { downloadAdminInvoice } from '../../api/admin.js'
import { useInvoiceAction } from '../../hooks/useAdmin.js'
import useDownload from '../../hooks/useDownload.js'
import { apiErrorMessage, isValidationError } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { Button, ConfirmDialog, DropdownMenu, IconButton } from '../ui'
import PaymentDialog from './PaymentDialog.jsx'

/**
 * What the agency does with an invoice: download the PDF, mark it as paid (unpaid
 * only, asks the payment method), send it to the client again. `variant="buttons"`
 * on the reservation page, `variant="menu"` in a table row.
 */
export default function InvoiceActions({ invoice, variant = 'buttons', className }) {
  const [dialog, setDialog] = useState(null)
  const mutation = useInvoiceAction()
  const pdf = useDownload(downloadAdminInvoice)
  const unpaid = invoice.status === 'unpaid'

  function close() {
    if (mutation.isPending) return
    setDialog(null)
    mutation.reset()
  }

  function run(type, body = {}) {
    mutation.mutate(
      { type, number: invoice.number, paymentMethod: body.payment_method },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          setDialog(null)
          mutation.reset()
        },
        onError: (error) => {
          if (isValidationError(error)) return
          toast.error('Action impossible', { description: apiErrorMessage(error) })
          setDialog(null)
        },
      },
    )
  }

  const actions = [
    {
      key: 'pdf',
      label: 'Télécharger la facture',
      icon: FileDown,
      onClick: () => pdf.download(invoice.number),
    },
    unpaid && {
      key: 'markPaid',
      label: 'Marquer comme payée',
      icon: CircleCheck,
      onClick: () => setDialog('markPaid'),
    },
    { key: 'send', label: 'Renvoyer au client', icon: Send, onClick: () => setDialog('send') },
  ].filter(Boolean)

  return (
    <>
      {variant === 'menu' ? (
        <DropdownMenu
          trigger={
            <IconButton
              icon={Ellipsis}
              label={`Actions de la facture ${invoice.number}`}
              variant="ghost"
              size="sm"
            />
          }
          items={actions.map(({ label, icon, onClick }) => ({ label, icon, onClick }))}
        />
      ) : (
        <div className={cn('flex flex-wrap gap-2', className)}>
          {actions.map(({ key, label, icon, onClick }) => (
            <Button
              key={key}
              size="sm"
              variant={key === 'markPaid' ? 'primary' : 'secondary'}
              leftIcon={icon}
              loading={key === 'pdf' && pdf.isPending}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <PaymentDialog
        key={`paid-${invoice.number}-${dialog}`}
        open={dialog === 'markPaid'}
        onClose={close}
        onSubmit={(body) => run('markPaid', body)}
        loading={mutation.isPending}
        errors={mutation.error}
        defaultMethod={invoice.payment_method ?? ''}
        title="Marquer la facture comme payée ?"
        description={`Facture ${invoice.number}`}
        confirmLabel="Marquer comme payée"
      />

      <ConfirmDialog
        open={dialog === 'send'}
        onClose={close}
        onConfirm={() => run('send')}
        loading={mutation.isPending}
        title="Renvoyer la facture ?"
        description="Le client la reçoit par e-mail, avec le PDF."
        confirmLabel="Renvoyer au client"
      />
    </>
  )
}
