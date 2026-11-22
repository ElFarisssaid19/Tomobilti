import { toast } from 'sonner'
import { updatePassword } from '../../api/auth.js'
import PasswordStrength from '../../components/auth/PasswordStrength.jsx'
import { Button, PasswordInput } from '../../components/ui'
import useForm from '../../hooks/useForm.js'
import { isValidPassword, PASSWORD_HINT } from '../../lib/auth.js'

const EMPTY = { current_password: '', password: '', password_confirmation: '' }

function validate(values) {
  const errors = {}
  if (!values.current_password) errors.current_password = ['Saisissez votre mot de passe actuel.']
  if (!isValidPassword(values.password)) errors.password = [PASSWORD_HINT]
  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = ['Les deux mots de passe ne correspondent pas.']
  }
  return errors
}

export default function PasswordForm() {
  const form = useForm(EMPTY)

  async function send(values) {
    await updatePassword(values)
    form.setValues(EMPTY)
    toast.success('Mot de passe modifié', {
      description: 'Les autres appareils connectés devront se reconnecter.',
    })
  }

  return (
    <form
      noValidate
      onSubmit={(event) =>
        form.handleSubmit(event, {
          validate,
          send,
          errorTitle: 'Le mot de passe n’a pas été modifié',
        })
      }
      className="flex flex-col gap-5"
    >
      <PasswordInput
        label="Mot de passe actuel"
        autoComplete="current-password"
        required
        {...form.field('current_password')}
      />
      <div className="flex flex-col gap-2.5">
        <PasswordInput
          label="Nouveau mot de passe"
          autoComplete="new-password"
          hint={PASSWORD_HINT}
          required
          {...form.field('password')}
        />
        <PasswordStrength password={form.values.password} />
      </div>
      <PasswordInput
        label="Confirmation du nouveau mot de passe"
        autoComplete="new-password"
        required
        {...form.field('password_confirmation')}
      />
      <div>
        <Button type="submit" loading={form.submitting}>
          Modifier le mot de passe
        </Button>
      </div>
    </form>
  )
}
