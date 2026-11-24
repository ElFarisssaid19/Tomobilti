import { UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSetClientActive } from '../../hooks/useAdmin.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { Button, ConfirmDialog } from '../ui'

/**
 * Deactivate (signs the customer out everywhere, and they cannot sign in again) or
 * reactivate an account, behind a confirmation.
 */
export default function ClientActivationButton({ client, size = 'md' }) {
  const [open, setOpen] = useState(false)
  const mutation = useSetClientActive()
  const deactivating = client.is_active

  function confirm() {
    mutation.mutate(
      { id: client.id, active: !deactivating },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          setOpen(false)
        },
        onError: (error) => {
          toast.error('Action impossible', { description: apiErrorMessage(error) })
          setOpen(false)
        },
      },
    )
  }

  return (
    <>
      <Button
        size={size}
        variant={deactivating ? 'secondary' : 'primary'}
        leftIcon={deactivating ? UserX : UserCheck}
        onClick={() => setOpen(true)}
      >
        {deactivating ? 'Désactiver le compte' : 'Réactiver le compte'}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={mutation.isPending}
        tone={deactivating ? 'danger' : 'primary'}
        title={
          deactivating
            ? `Désactiver le compte de ${client.name} ?`
            : `Réactiver le compte de ${client.name} ?`
        }
        description={
          deactivating
            ? 'Le client est déconnecté sur tous ses appareils et ne peut plus se connecter ni réserver. Ses réservations ne sont pas annulées.'
            : 'Le client pourra de nouveau se connecter et réserver.'
        }
        confirmLabel={deactivating ? 'Désactiver le compte' : 'Réactiver le compte'}
      />
    </>
  )
}
