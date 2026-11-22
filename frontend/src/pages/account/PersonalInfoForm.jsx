import { toast } from 'sonner'
import { updateProfile } from '../../api/auth.js'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import useForm from '../../hooks/useForm.js'
import { isEmail, isMoroccanPhone } from '../../lib/auth.js'
import { latestBirthDateForAge } from '../../lib/dates.js'

const FIELDS = ['name', 'email', 'phone', 'birth_date', 'city', 'address']

function pick(user) {
  return Object.fromEntries(FIELDS.map((field) => [field, user[field] ?? '']))
}

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = ['Saisissez votre nom complet.']
  if (!isEmail(values.email)) errors.email = ['Saisissez une adresse e-mail valide.']
  if (!isMoroccanPhone(values.phone)) {
    errors.phone = ['Saisissez un numéro marocain, par exemple 06 12 34 56 78.']
  }
  return errors
}

export default function PersonalInfoForm() {
  const { user, setUser } = useAuth()
  const form = useForm(pick(user))

  async function send(values) {
    const { user: savedUser, message } = await updateProfile(values)
    setUser(savedUser)
    form.setValues(pick(savedUser))
    const emailChanged = savedUser.email !== user.email
    toast.success('Informations enregistrées', emailChanged ? { description: message } : undefined)
  }

  return (
    <form
      noValidate
      onSubmit={(event) => form.handleSubmit(event, { validate, send })}
      className="grid gap-5 sm:grid-cols-2"
    >
      <Input
        label="Nom complet"
        autoComplete="name"
        required
        className="sm:col-span-2"
        {...form.field('name')}
      />
      <Input
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        hint="Une nouvelle adresse devra être confirmée."
        required
        {...form.field('email')}
      />
      <Input label="Téléphone" type="tel" autoComplete="tel" required {...form.field('phone')} />
      <Input
        label="Date de naissance"
        type="date"
        autoComplete="bday"
        max={latestBirthDateForAge(18)}
        hint="18 ans minimum."
        {...form.field('birth_date')}
      />
      <Input label="Ville" autoComplete="address-level2" {...form.field('city')} />
      <Input
        label="Adresse"
        autoComplete="street-address"
        className="sm:col-span-2"
        {...form.field('address')}
      />
      <div className="sm:col-span-2">
        <Button type="submit" loading={form.submitting}>
          Enregistrer les informations
        </Button>
      </div>
    </form>
  )
}
