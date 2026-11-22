import { MailCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Alert, Button, LoadingRegion, Skeleton } from '../../components/ui'
import { resendVerificationEmail, verifyEmail } from '../../api/auth.js'
import { useAuth } from '../../context/authContext.js'
import { apiErrorMessage } from '../../lib/auth.js'

const SCREENS = {
  verified: {
    tone: 'success',
    title: 'Adresse e-mail vérifiée',
    text: 'Votre compte est prêt : vous pouvez réserver une voiture.',
  },
  already_verified: {
    tone: 'success',
    title: 'Adresse déjà vérifiée',
    text: 'Ce lien a déjà servi. Votre adresse est confirmée, rien d’autre à faire.',
  },
  expired: {
    tone: 'warning',
    title: 'Ce lien a expiré',
    text: 'Les liens de vérification sont valables 60 minutes. Demandez-en un nouveau.',
  },
  invalid: {
    tone: 'danger',
    title: 'Lien de vérification invalide',
    text: 'Le lien est incomplet ou ne correspond plus à votre adresse. Ouvrez le dernier e-mail reçu, ou demandez un nouveau lien.',
  },
}

/**
 * /verifier-email?id&hash&expires&signature (link from the verification email).
 * Sends the parameters to the API once, then shows the result. Works signed in or not.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const { status: authStatus, refreshUser } = useAuth()
  const params = {
    id: searchParams.get('id'),
    hash: searchParams.get('hash'),
    expires: searchParams.get('expires'),
    signature: searchParams.get('signature'),
  }
  const isComplete = Object.values(params).every(Boolean)
  const [result, setResult] = useState(isComplete ? { status: 'loading' } : { status: 'invalid' })
  const [resending, setResending] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    // The link is single-use in spirit: never send it twice (React StrictMode runs effects twice).
    if (!isComplete || requested.current) return
    requested.current = true

    verifyEmail(params)
      .then((data) => {
        setResult({ status: data.status })
        refreshUser()
      })
      .catch((error) => {
        const reason = error.response?.data?.status
        if (reason === 'expired' || reason === 'invalid') setResult({ status: reason })
        else setResult({ status: 'error', message: apiErrorMessage(error) })
      })
    // Runs once for the link in the address bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleResend() {
    setResending(true)
    try {
      const data = await resendVerificationEmail()
      toast.success(
        data.status === 'already_verified' ? 'Adresse déjà vérifiée' : 'Nouveau lien envoyé',
        { description: data.message },
      )
    } catch (error) {
      toast.error('Le lien n’a pas pu être envoyé', { description: apiErrorMessage(error) })
    } finally {
      setResending(false)
    }
  }

  if (result.status === 'loading') {
    return (
      <AuthShell
        photo="verify"
        title="Vérification en cours"
        description="Un instant, nous confirmons votre adresse e-mail."
      >
        <LoadingRegion
          label="Vérification de votre adresse e-mail…"
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-20 w-full rounded-input" />
          <Skeleton className="h-11 w-48 rounded-full" />
        </LoadingRegion>
      </AuthShell>
    )
  }

  const screen = SCREENS[result.status] ?? {
    tone: 'danger',
    title: 'La vérification n’a pas abouti',
    text: result.message,
  }
  const succeeded = result.status === 'verified' || result.status === 'already_verified'
  const isSignedIn = authStatus === 'authenticated'

  return (
    <AuthShell photo="verify" title={screen.title}>
      <Alert tone={screen.tone}>{screen.text}</Alert>

      <div className="flex flex-wrap gap-3">
        {succeeded && isSignedIn && <Button to="/espace/profil">Aller à mon espace</Button>}
        {succeeded && !isSignedIn && <Button to="/connexion">Se connecter</Button>}
        {!succeeded && isSignedIn && (
          <Button leftIcon={MailCheck} loading={resending} onClick={handleResend}>
            Recevoir un nouveau lien
          </Button>
        )}
        {!succeeded && !isSignedIn && (
          <Button to={`/connexion?redirect=${encodeURIComponent('/espace/profil')}`}>
            Se connecter pour recevoir un nouveau lien
          </Button>
        )}
        <Button to="/voitures" variant="secondary">
          Voir les voitures
        </Button>
      </div>
    </AuthShell>
  )
}
