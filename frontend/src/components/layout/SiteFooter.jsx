import { Camera, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router'
import { IconButton } from '../ui'
import Logo from './Logo.jsx'

const COLUMNS = [
  {
    title: 'Location',
    links: [
      { label: 'Toutes les voitures', to: '/voitures' },
      { label: 'Mes réservations', to: '/mon-espace/reservations' },
      { label: 'Créer un compte', to: '/inscription' },
    ],
  },
  {
    title: 'L’agence',
    links: [
      { label: 'À propos', to: '/a-propos' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

// lucide-react no longer ships brand logos: generic icons with explicit labels.
const SOCIAL = [
  { label: 'WhatsApp', icon: MessageCircle, href: '#' },
  { label: 'Instagram', icon: Camera, href: '#' },
  { label: 'E-mail', icon: Mail, href: 'mailto:contact@tomobilti.ma' },
]

/** Site footer. Agency details are placeholders until the real ones are provided. */
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
              <MapPin className="size-4 text-fg-subtle" aria-hidden="true" />
              Adresse de l’agence à compléter
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-fg-subtle" aria-hidden="true" />
              <span className="tabular-nums">+212 5 00 00 00 00</span>
            </li>
          </ul>
          <ul className="flex gap-2" aria-label="Réseaux sociaux">
            {SOCIAL.map(({ label, icon, href }) => (
              <li key={label}>
                <IconButton icon={icon} label={label} href={href} size="sm" />
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
        <p className="container-page py-6 text-sm text-fg-subtle">
          © {new Date().getFullYear()} Tomobilti. Prix en dirhams (DH), TTC.
        </p>
      </div>
    </footer>
  )
}
