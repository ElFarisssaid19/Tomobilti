import { CircleCheck, MailCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { resendVerificationEmail } from '../../api/auth.js'
import { Alert, Button, LoadingRegion, Skeleton } from '../../components/ui'
import { formatPhone } from '../../config/agency.js'
import { useAuth } from '../../context/authContext.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { formatDate } from '../../utils/format.js'
import ProfileCompletionForm from './ProfileCompletionForm.jsx'

/**
 * Step 3: can this customer book? The answer comes from the server (the quote's
 * eligibility, checked for the pick-up date). Missing profile fields are completed
 * inline; an unverified email blocks the next step until confirmed; age and licence
 * problems are explained.
 */
export default function StepInformation({ quote, quoteLoading, refreshEligibility }) {
  const { user } = useAuth()
  const eligibility = quote?.eligibility

  if (!eligibility) {
    return (
      <LoadingRegion label="Vérification de votre profil…" className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </LoadingRegion>
    )
  }

  const reasons = Object.fromEntries(eligibility.reasons.map((reason) => [reason.code, reason]))

  if (eligibility.eligible) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success" title="Vous pouvez réserver" />
        <DriverSummary user={user} />
      </div>
    )
  }

  return (
    <div className={quoteLoading ? 'flex flex-col gap-5 opacity-60' : 'flex flex-col gap-5'}>
      {reasons.account_inactive && (
        <Alert tone="danger" title="Compte désactivé">
          {reasons.account_inactive.message}
        </Alert>
      )}
      {reasons.email_unverified && (
        <EmailNotVerified email={user.email} refreshEligibility={refreshEligibility} />
      )}
      {reasons.profile_incomplete && (
        <section aria-labelledby="profil-manquant" className="flex flex-col gap-4">
          <h3 id="profil-manquant" className="text-lg font-bold text-fg">
            Complétez votre profil
          </h3>
          <ProfileCompletionForm
            missingFields={eligibility.missing_fields}
            onSaved={refreshEligibility}
          />
        </section>
      )}
      {reasons.under_age && (
        <Alert tone="danger" title="Âge minimum non atteint">
          {reasons.under_age.message} Si votre date de naissance est erronée, corrigez-la dans{' '}
          <ProfileLink />.
        </Alert>
      )}
      {reasons.license_too_recent && (
        <Alert tone="danger" title="Permis trop récent">
          {reasons.license_too_recent.message} Choisissez une date de prise en charge plus tardive,
          ou corrigez la date d’obtention dans <ProfileLink />.
        </Alert>
      )}
    </div>
  )
}

function ProfileLink() {
  return (
    <Link to="/espace/profil" className="link-underline rounded-xs font-semibold text-fg">
      votre profil
    </Link>
  )
}

function EmailNotVerified({ email, refreshEligibility }) {
  const { refreshUser } = useAuth()
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)

  async function resend() {
    setSending(true)
    try {
      await resendVerificationEmail()
      toast.success('E-mail de vérification renvoyé', {
        description: `Ouvrez le lien envoyé à ${email}.`,
      })
    } catch (error) {
      toast.error('L’e-mail n’a pas pu être renvoyé', { description: apiErrorMessage(error) })
    } finally {
      setSending(false)
    }
  }

  async function check() {
    setChecking(true)
    try {
      await refreshUser()
      await refreshEligibility()
    } finally {
      setChecking(false)
    }
  }

  return (
    <Alert tone="warning" title="Confirmez votre adresse e-mail">
      <p>
        Ouvrez le lien envoyé à <span className="font-semibold text-fg">{email}</span>, puis revenez
        ici : votre réservation est gardée.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={MailCheck}
          loading={sending}
          onClick={resend}
        >
          Renvoyer l’e-mail
        </Button>
        <Button variant="ghost" size="sm" leftIcon={RefreshCw} loading={checking} onClick={check}>
          J’ai confirmé mon adresse
        </Button>
      </div>
    </Alert>
  )
}

function DriverSummary({ user }) {
  const rows = [
    { label: 'Conducteur', value: user.name },
    { label: 'Téléphone', value: formatPhone(user.phone) },
    { label: 'CIN', value: user.cin },
    {
      label: 'Permis',
      value: `${user.driving_license_number}, depuis le ${formatDate(user.driving_license_issued_at)}`,
    },
  ]

  return (
    <section
      aria-labelledby="conducteur"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="conducteur" className="flex items-center gap-2 font-bold text-fg">
          <CircleCheck className="size-5 text-success" aria-hidden="true" />
          Conducteur principal
        </h3>
        <Link
          to="/espace/profil"
          className="link-underline touch-target rounded-xs text-sm font-semibold text-accent-text"
        >
          Modifier mon profil
        </Link>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-fg-subtle">{row.label}</dt>
            <dd className="font-semibold text-fg tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
