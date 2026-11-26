import { Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { sendContactMessage } from '../api/catalog.js'
import { WhatsAppIcon } from '../components/layout/SocialIcons.jsx'
import { AgencyCard } from '../components/site/AgencyList.jsx'
import {
  Button,
  ErrorState,
  Input,
  LoadingRegion,
  PageHeader,
  Skeleton,
  Textarea,
} from '../components/ui'
import { AGENCY, whatsappUrl } from '../config/agency.js'
import { useLocations } from '../hooks/useCatalog.js'
import useForm from '../hooks/useForm.js'
import usePageMeta from '../hooks/usePageMeta.js'
import { isEmail } from '../lib/auth.js'

const EMPTY_MESSAGE = { name: '', email: '', phone: '', subject: '', message: '' }

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = ['Saisissez votre nom.']
  if (!values.email.trim()) errors.email = ['Saisissez votre adresse e-mail.']
  else if (!isEmail(values.email)) errors.email = ['Saisissez une adresse e-mail valide.']
  if (values.subject.trim().length < 3) errors.subject = ['Indiquez le sujet de votre message.']
  if (values.message.trim().length < 10)
    errors.message = ['Votre message doit contenir au moins 10 caractères.']
  return errors
}

/** /contact: message form (POST /api/contact), phone, WhatsApp, agencies and hours. */
export default function ContactPage() {
  usePageMeta(
    'Contact',
    'Contactez Tomobilti par téléphone, WhatsApp ou e-mail, ou retrouvez l’adresse et les horaires de nos agences.',
  )
  const form = useForm(EMPTY_MESSAGE)

  async function handleSubmit(event) {
    const sent = await form.handleSubmit(event, {
      validate,
      send: (values) => sendContactMessage({ ...values, phone: values.phone.trim() || null }),
      errorTitle: 'Le message n’a pas pu être envoyé',
    })
    if (sent) {
      toast.success('Message envoyé', {
        description: 'L’agence vous répondra par e-mail.',
      })
      form.setValues(EMPTY_MESSAGE)
    }
  }

  return (
    <div className="container-page flex flex-1 flex-col gap-10 pt-24 pb-20 md:pt-32">
      <PageHeader title="Contact" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
        <section
          aria-labelledby="formulaire"
          className="rounded-card-lg border border-line bg-surface p-5 sm:p-7"
        >
          <h2 id="formulaire" className="mb-6 text-xl font-bold text-fg">
            Envoyer un message
          </h2>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Nom" autoComplete="name" required {...form.field('name')} />
              <Input
                label="Adresse e-mail"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                {...form.field('email')}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Téléphone"
                type="tel"
                autoComplete="tel"
                hint="Facultatif"
                {...form.field('phone')}
              />
              <Input label="Sujet" required {...form.field('subject')} />
            </div>
            <Textarea label="Message" rows={6} required {...form.field('message')} />
            <Button
              type="submit"
              size="lg"
              loading={form.submitting}
              className="self-stretch sm:self-start"
            >
              Envoyer le message
            </Button>
          </form>
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="joindre" className="flex flex-col gap-4">
            <h2 id="joindre" className="text-xl font-bold text-fg">
              Nous joindre
            </h2>
            <ul className="flex flex-col gap-3">
              <ContactLink
                href={`tel:${AGENCY.phone}`}
                icon={Phone}
                label="Téléphone"
                value={AGENCY.phoneDisplay}
              />
              <ContactLink
                href={whatsappUrl('Bonjour Tomobilti, ')}
                icon={WhatsAppIcon}
                label="WhatsApp"
                value="Écrire sur WhatsApp"
                external
              />
              <ContactLink
                href={`mailto:${AGENCY.email}`}
                icon={Mail}
                label="E-mail"
                value={AGENCY.email}
              />
            </ul>
          </section>
          <Agencies />
        </div>
      </div>
    </div>
  )
}

function ContactLink({ href, icon: Icon, label, value, external = false }) {
  return (
    <li>
      <a
        href={href}
        {...(external && { target: '_blank', rel: 'noreferrer noopener' })}
        className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition-[border-color,background-color] duration-150 hover:border-line-strong hover:bg-raised"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-raised text-fg transition-colors duration-150 group-hover:bg-lime group-hover:text-on-lime">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <span className="text-sm text-fg-muted">{label}</span>
          <span className="font-semibold text-fg tabular-nums">{value}</span>
        </span>
        {external && <span className="sr-only">(nouvel onglet)</span>}
      </a>
    </li>
  )
}

/** Agencies and their opening hours, compact. */
function Agencies() {
  const { data: locations, isPending, isError, error, refetch } = useLocations()

  return (
    <section aria-labelledby="horaires" className="flex flex-col gap-4">
      <h2 id="horaires" className="text-xl font-bold text-fg">
        Agences et horaires
      </h2>
      {isPending ? (
        <LoadingRegion label="Chargement des agences…" className="flex flex-col gap-3">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-44 rounded-card" />
          ))}
        </LoadingRegion>
      ) : isError ? (
        <ErrorState title="Impossible de charger les agences" error={error} onRetry={refetch} />
      ) : (
        <ul className="flex flex-col gap-3">
          {locations.map((location) => (
            <li key={location.slug}>
              <AgencyCard location={location} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
