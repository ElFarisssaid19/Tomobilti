import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { resendVerificationEmail } from '../../api/auth.js'
import { useAuth } from '../../context/authContext.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { Alert, Button } from '../ui'

/** Reminder shown in "Mon espace" until the email address is verified. */
export default function EmailVerificationBanner({ className }) {
  const { user, isVerified } = useAuth()
  const [sending, setSending] = useState(false)

  if (!user || isVerified) return null

  async function handleResend() {
    setSending(true)
    try {
      await resendVerificationEmail()
      toast.success('E-mail de vérification renvoyé', {
        description: `Ouvrez le lien envoyé à ${user.email}.`,
      })
    } catch (error) {
      toast.error('L’e-mail n’a pas pu être renvoyé', { description: apiErrorMessage(error) })
    } finally {
      setSending(false)
    }
  }

  return (
    <Alert
      tone="warning"
      title="Confirmez votre adresse e-mail"
      className={className}
      action={
        <Button
          variant="secondary"
          size="sm"
          leftIcon={MailCheck}
          loading={sending}
          onClick={handleResend}
        >
          Renvoyer l’e-mail
        </Button>
      }
    >
      Ouvrez le lien envoyé à <span className="font-semibold text-fg">{user.email}</span> pour
      pouvoir réserver.
    </Alert>
  )
}
