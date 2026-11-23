import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { AGENCY, whatsappUrl } from '../../config/agency.js'
import { IconButton } from '../ui'
import Logo from './Logo.jsx'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons.jsx'

const COLUMNS = [
  {
    title: 'Location',
    links: [
      { label: 'Toutes les voitures', to: '/voitures' },
      { label: 'Mes réservations', to: '/espace/reservations' },
      { label: 'Créer un compte', to: '/inscription' },
    ],
  },
  {
    title: 'L’agence',
    links: [
      { label: 'À propos', to: '/a-propos' },
      { label: 'Nos agences', to: '/a-propos#agences' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

// Brand logos from Simple Icons (CC0): the documented exception to lucide-only icons.
const SOCIAL = [
  { label: 'WhatsApp (nouvel onglet)', icon: WhatsAppIcon, href: whatsappUrl(), external: true },
  {
    label: 'Instagram (nouvel onglet)',
    icon: InstagramIcon,
    href: AGENCY.social.instagram,
    external: true,
  },
  {
    label: 'Facebook (nouvel onglet)',
    icon: FacebookIcon,
    href: AGENCY.social.facebook,
    external: true,
  },
  { label: `E-mail : ${AGENCY.email}`, icon: Mail, href: `mailto:${AGENCY.email}` },
]

/** Site footer, with the agency contact details from config/agency.js. */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div className="flex max-w-sm flex-col gap-4">
          <Logo />
          <p className="text-sm text-fg-muted">
            Location de voitures à Marrakech, Casablanca et Agadir, en agence ou à l’aéroport.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-fg-muted">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              {AGENCY.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              <a
                href={`tel:${AGENCY.phone}`}
                className="link-underline rounded-xs tabular-nums hover:text-fg"
              >
                {AGENCY.phoneDisplay}
              </a>
            </li>
          </ul>
          <ul className="flex gap-2" aria-label="Réseaux sociaux">
            {SOCIAL.map(({ label, icon, href, external }) => (
              <li key={label}>
                <IconButton
                  icon={icon}
                  label={label}
                  href={href}
                  size="sm"
                  {...(external && { target: '_blank', rel: 'noreferrer noopener' })}
                />
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-fg">{column.title}</h2>
            <ul className="flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="link-underline rounded-xs text-sm text-fg-muted hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tomobilti. Prix en dirhams (DH), TTC.</p>
          <Link
            to="/credits"
            className="link-underline self-start rounded-xs hover:text-fg sm:self-auto"
          >
            Crédits photos
          </Link>
        </div>
      </div>
    </footer>
  )
}
