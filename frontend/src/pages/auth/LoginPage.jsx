import { useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import AuthShell from '../../components/auth/AuthShell.jsx'
import { Alert, Button, Checkbox, Input, PasswordInput } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import {
  apiErrorMessage,
  firstName,
  focusFirstInvalid,
  isEmail,
  isValidationError,
} from '../../lib/auth.js'

const FORM_ERROR_TITLES = {
  403: 'Compte désactivé',
  429: 'Trop de tentatives',
}

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = ['Saisissez votre adresse e-mail.']
  else if (!isEmail(email)) errors.email = ['Saisissez une adresse e-mail valide.']
  if (!password) errors.password = ['Saisissez votre mot de passe.']
  return errors
}

/**
 * /connexion. On success GuestRoute sends the user on (admin area, `?redirect=` or
 * profile). Wrong credentials appear under the field (422); a disabled account (403)
 * or too many attempts (429) appear above the form.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const formRef = useRef(null)
  const [values, setValues] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
    remember: false,
  })
  const [errors, setErrors] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect')
  const passwordWasReset = location.state?.passwordReset === true

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = validate(values)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      focusFirstInvalid(formRef.current)
      return
    }

    setErrors(null)
    setSubmitting(true)
    try {
      const user = await login(values)
      toast.success(`Bonjour, ${firstName(user)}`)
    } catch (error) {
      if (isValidationError(error)) {
        setErrors(error)
        focusFirstInvalid(formRef.current)
      } else {
        const status = error.response?.status
        setFormError({
          title: FORM_ERROR_TITLES[status] ?? 'Connexion impossible',
          message: apiErrorMessage(error),
        })
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      photo="login"
      title="Connexion"
      description={redirect ? 'Connectez-vous pour continuer.' : undefined}
      footer={
        <p>
          Pas encore de compte ?{' '}
          <Link
            to="/inscription"
            className="link-underline rounded-xs font-semibold text-accent-text"
          >
            Créer un compte
          </Link>
        </p>
      }
    >
      {passwordWasReset && !formError && (
        <Alert tone="success" title="Mot de passe réinitialisé">
          Connectez-vous avec votre nouveau mot de passe.
        </Alert>
      )}
      {formError && (
        <Alert tone="danger" title={formError.title}>
          {formError.message}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update('email')}
          errors={errors}
          required
        />
        <div className="flex flex-col gap-2">
          <PasswordInput
            label="Mot de passe"
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={update('password')}
            errors={errors}
            required
          />
          <Link
            to="/mot-de-passe-oublie"
            className="link-underline touch-target self-end rounded-xs text-sm font-semibold text-accent-text"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Checkbox
          label="Se souvenir de moi"
          name="remember"
          checked={values.remember}
          onChange={(remember) => setValues((current) => ({ ...current, remember }))}
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          Se connecter
        </Button>
      </form>
    </AuthShell>
  )
}
