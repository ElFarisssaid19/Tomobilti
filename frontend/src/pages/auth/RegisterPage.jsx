import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import AuthShell from '../../components/auth/AuthShell.jsx'
import PasswordStrength from '../../components/auth/PasswordStrength.jsx'
import { Alert, Button, Checkbox, Input, PasswordInput } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import {
  apiErrorMessage,
  focusFirstInvalid,
  isEmail,
  isMoroccanPhone,
  isValidationError,
  isValidPassword,
  PASSWORD_HINT,
} from '../../lib/auth.js'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  terms: false,
}

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = ['Saisissez votre nom complet.']
  if (!isEmail(values.email)) errors.email = ['Saisissez une adresse e-mail valide.']
  if (!isMoroccanPhone(values.phone)) {
    errors.phone = ['Saisissez un numéro marocain, par exemple 06 12 34 56 78.']
  }
  if (!isValidPassword(values.password)) errors.password = [PASSWORD_HINT]
  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = ['Les deux mots de passe ne correspondent pas.']
  }
  if (!values.terms) errors.terms = ['Acceptez les conditions pour créer votre compte.']
  return errors
}

/** /inscription: creates a client account, logs it in and sends the verification email. */
export default function RegisterPage() {
  const { register } = useAuth()
  const formRef = useRef(null)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
      const user = await register(values)
      toast.success('Compte créé', {
        description: `Confirmez votre adresse avec le lien envoyé à ${user.email}.`,
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

  return (
    <AuthShell
      photo="register"
      title="Créer un compte"
      description="Quelques informations pour réserver en ligne. Le permis et la CIN se complètent plus tard."
      footer={
        <p>
          Déjà un compte ?{' '}
          <Link
            to="/connexion"
            className="link-underline rounded-xs font-semibold text-accent-text"
          >
            Se connecter
          </Link>
        </p>
      }
    >
      {formError && (
        <Alert tone="danger" title="Inscription impossible">
          {formError}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Nom complet"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={update('name')}
          errors={errors}
          required
        />
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
        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          hint="Pour vous joindre le jour du retrait."
          value={values.phone}
          onChange={update('phone')}
          errors={errors}
          required
        />
        <div className="flex flex-col gap-2.5">
          <PasswordInput
            label="Mot de passe"
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
        <Checkbox
          label="J’accepte les conditions générales de location et la politique de confidentialité"
          name="terms"
          checked={values.terms}
          onChange={(terms) => setValues((current) => ({ ...current, terms }))}
          errors={errors}
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
          Créer mon compte
        </Button>
      </form>
    </AuthShell>
  )
}
