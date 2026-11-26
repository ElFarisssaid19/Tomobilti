import { toast } from 'sonner'
import { updateProfile } from '../../api/auth.js'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import useForm from '../../hooks/useForm.js'
import { toInputDate } from '../../lib/dates.js'

const FIELDS = ['cin', 'driving_license_number', 'driving_license_issued_at']

function pick(user) {
  return Object.fromEntries(FIELDS.map((field) => [field, user[field] ?? '']))
}

function validate(values) {
  const errors = {}
  if (values.cin && !/^[A-Za-z]{1,2}\s?\d{4,6}$/.test(values.cin.trim())) {
    errors.cin = ['Saisissez un numéro de CIN valide, par exemple BE123456.']
  }
  return errors
}

export default function LicenseForm() {
  const { user, setUser } = useAuth()
  const form = useForm(pick(user))

  async function send(values) {
    const { user: savedUser } = await updateProfile(values)
    setUser(savedUser)
    form.setValues(pick(savedUser))
    toast.success('Permis et pièce d’identité enregistrés')
  }

  return (
    <form
      noValidate
      onSubmit={(event) => form.handleSubmit(event, { validate, send })}
      className="grid gap-5 sm:grid-cols-2"
    >
      <Input
        label="Numéro de CIN"
        autoComplete="off"
        placeholder="BE123456"
        hint="Passeport pour les visiteurs, à présenter en agence."
        className="sm:col-span-2"
        {...form.field('cin')}
      />
      <Input
        label="Numéro de permis"
        autoComplete="off"
        placeholder="12/345678"
        {...form.field('driving_license_number')}
      />
      <Input
        label="Date d’obtention du permis"
        type="date"
        max={toInputDate(new Date())}
        hint="2 ans de permis minimum pour louer."
        {...form.field('driving_license_issued_at')}
      />
      <div className="sm:col-span-2">
        <Button type="submit" loading={form.submitting}>
          Enregistrer le permis et la CIN
        </Button>
      </div>
    </form>
  )
}
