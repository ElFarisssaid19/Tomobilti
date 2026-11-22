import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import AuthShell from '../../components/auth/AuthShell.jsx'
import PasswordStrength from '../../components/auth/PasswordStrength.jsx'
import { Alert, Button, Input, PasswordInput } from '../../components/ui'
import { resetPassword } from '../../api/auth.js'
import {
  apiErrorMessage,
  focusFirstInvalid,
  isValidationError,
  isValidPassword,
  PASSWORD_HINT,
} from '../../lib/auth.js'
import { getFieldError } from '../../lib/validation.js'

/**
 * /reinitialiser-mot-de-passe?token=…&email=… (link from the reset email).
 * On success, the login page opens with the email filled in.
 */
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const formRef = useRef(null)
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [values, setValues] = useState({ password: '', password_confirmation: '' })
  const [errors, setErrors] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const linkIsIncomplete = !token || !email
  // An invalid or expired token comes back as an error on "email".
  const tokenError = getFieldError(errors, 'email')

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = {}
    if (!isValidPassword(values.password)) clientErrors.password = [PASSWORD_HINT]
    if (values.password_confirmation !== values.password) {
      clientErrors.password_confirmation = ['Les deux mots de passe ne correspondent pas.']
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      focusFirstInvalid(formRef.current)
      return
    }

    setErrors(null)
    setSubmitting(true)
    try {
      await resetPassword({ token, email, ...values })
      toast.success('Mot de passe réinitialisé')
      navigate(`/connexion?email=${encodeURIComponent(email)}`, {
        replace: true,
        state: { passwordReset: true },
      })
    } catch (error) {
      if (isValidationError(error)) {
        setErrors(error)
        focusFirstInvalid(formRef.current)
      } else {
        setFormError(apiErrorMessage(error))
      }
      setSubmitting(false)
    }
  }

  const newLinkButton = (
    <Button to="/mot-de-passe-oublie" variant="secondary" size="sm">
      Demander un nouveau lien
    </Button>
  )

  return (
    <AuthShell
      photo="password"
      title="Nouveau mot de passe"
      description="Choisissez le mot de passe que vous utiliserez pour vous connecter."
      footer={
        <p>
          <Link
            to="/connexion"
            className="link-underline rounded-xs font-semibold text-accent-text"
          >
            Retour à la connexion
          </Link>
        </p>
      }
    >
      {linkIsIncomplete ? (
        <Alert tone="danger" title="Lien incomplet" action={newLinkButton}>
          Ouvrez le lien tel quel depuis l’e-mail, ou demandez-en un nouveau.
        </Alert>
      ) : (
        <>
          {tokenError && (
            <Alert tone="danger" title="Lien invalide ou expiré" action={newLinkButton}>
              {tokenError}
            </Alert>
          )}
          {formError && (
            <Alert tone="danger" title="La réinitialisation a échoué">
              {formError}
            </Alert>
          )}
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Adresse e-mail"
              name="email_display"
              type="email"
              autoComplete="username"
              value={email}
              readOnly
              disabled
            />
            <div className="flex flex-col gap-2.5">
              <PasswordInput
                label="Nouveau mot de passe"
                name="password"
                autoComplete="new-password"
                hint={PASSWORD_HINT}
                value={values.password}
                onChange={update('password')}
                errors={errors}
                required
              />
              <PasswordStrength password={values.password} />
            </div>
            <PasswordInput
              label="Confirmation du mot de passe"
              name="password_confirmation"
              autoComplete="new-password"
              value={values.password_confirmation}
              onChange={update('password_confirmation')}
              errors={errors}
              required
            />
            <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
              Enregistrer le mot de passe
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
