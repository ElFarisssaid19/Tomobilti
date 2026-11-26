import { toast } from 'sonner'
import { updateProfile } from '../../api/auth.js'
import { Button, Input } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import useForm from '../../hooks/useForm.js'
import { isMoroccanPhone } from '../../lib/auth.js'
import { latestBirthDateForAge, toInputDate } from '../../lib/dates.js'

/** Inputs of the booking profile fields (User::BOOKING_PROFILE_FIELDS on the server). */
const FIELDS = {
  phone: { label: 'Téléphone', type: 'tel', autoComplete: 'tel', placeholder: '06 12 34 56 78' },
  birth_date: { label: 'Date de naissance', type: 'date', autoComplete: 'bday' },
  cin: {
    label: 'Numéro de CIN',
    autoComplete: 'off',
    placeholder: 'BE123456',
    hint: 'Passeport pour les visiteurs, à présenter en agence.',
  },
  driving_license_number: {
    label: 'Numéro de permis',
    autoComplete: 'off',
    placeholder: '12/345678',
  },
  driving_license_issued_at: { label: 'Date d’obtention du permis', type: 'date' },
}

function validate(values) {
  const errors = {}
  for (const [field, value] of Object.entries(values)) {
    if (!String(value).trim()) {
      errors[field] = [`Le champ ${FIELDS[field].label.toLowerCase()} est obligatoire.`]
    }
  }
  if (values.phone && !isMoroccanPhone(values.phone)) {
    errors.phone = ['Saisissez un numéro marocain, par exemple 06 12 34 56 78.']
  }
  if (values.cin && !/^[A-Za-z]{1,2}\s?\d{4,6}$/.test(values.cin.trim())) {
    errors.cin = ['Saisissez un numéro de CIN valide, par exemple BE123456.']
  }
  return errors
}

/**
 * Completes only the missing profile fields without leaving the booking flow
 * (PUT /api/profile). `onSaved` refreshes the eligibility from the server.
 */
export default function ProfileCompletionForm({ missingFields, onSaved }) {
  const { setUser } = useAuth()
  const form = useForm(Object.fromEntries(missingFields.map((field) => [field, ''])))

  async function send(values) {
    const { user } = await updateProfile(values)
    setUser(user)
    toast.success('Profil complété')
    await onSaved?.()
  }

  const limits = {
    birth_date: { max: latestBirthDateForAge(18) },
    driving_license_issued_at: { max: toInputDate(new Date()) },
  }

  return (
    <form
      noValidate
      onSubmit={(event) =>
        form.handleSubmit(event, {
          validate,
          send,
          errorTitle: 'Le profil n’a pas pu être enregistré',
        })
      }
      className="grid gap-5 sm:grid-cols-2"
    >
      {missingFields.map((field) => {
        const { hint, ...props } = FIELDS[field]
        return (
          <Input
            key={field}
            required
            hint={hint}
            className={field === 'cin' ? 'sm:col-span-2' : undefined}
            {...props}
            {...limits[field]}
            {...form.field(field)}
          />
        )
      })}
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" loading={form.submitting}>
          Enregistrer et continuer
        </Button>
      </div>
    </form>
  )
}
