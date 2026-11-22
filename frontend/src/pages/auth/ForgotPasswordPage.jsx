import { MailCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Alert, Button, Input } from '../../components/ui'
import { requestPasswordReset } from '../../api/auth.js'
import { apiErrorMessage, focusFirstInvalid, isEmail, isValidationError } from '../../lib/auth.js'

/**
 * /mot-de-passe-oublie. The API answers the same way whether the account exists or
 * not, so the confirmation never says "this email is unknown".
 */
export default function ForgotPasswordPage() {
  const formRef = useRef(null)
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentMessage, setSentMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    if (!isEmail(email)) {
      setErrors({ email: ['Saisissez une adresse e-mail valide.'] })
      focusFirstInvalid(formRef.current)
      return
    }

    setErrors(null)
    setSubmitting(true)
    try {
      const { message } = await requestPasswordReset(email.trim())
      setSentMessage(message)
    } catch (error) {
      if (isValidationError(error)) {
        setErrors(error)
        focusFirstInvalid(formRef.current)
      } else {
        setFormError(apiErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const backToLogin = (
    <p>
      Vous vous en souvenez ?{' '}
      <Link to="/connexion" className="link-underline rounded-xs font-semibold text-accent-text">
        Se connecter
      </Link>
    </p>
  )

  if (sentMessage) {
    return (
      <AuthShell
        photo="password"
        title="Vérifiez vos e-mails"
        description={`Nous avons traité la demande pour ${email.trim()}.`}
        footer={backToLogin}
      >
        <Alert tone="success" title="Demande envoyée">
          {sentMessage} Le lien est valable 60 minutes. Pensez à regarder dans les courriers
          indésirables.
        </Alert>
        <Button variant="secondary" leftIcon={MailCheck} onClick={() => setSentMessage(null)}>
          Utiliser une autre adresse
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      photo="password"
      title="Mot de passe oublié"
      description="Saisissez l’adresse de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      footer={backToLogin}
    >
      {formError && (
        <Alert tone="danger" title="La demande n’a pas abouti">
          {formError}
        </Alert>
      )}
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          errors={errors}
          required
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Envoyer le lien
        </Button>
      </form>
    </AuthShell>
  )
}
