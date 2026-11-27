import { Clock, MapPin, Phone } from 'lucide-react'
import { formatPhone } from '../../config/agency.js'
import { cn } from '../../lib/cn.js'
import { WhatsAppIcon } from '../layout/SocialIcons.jsx'

/** "+212524000102" -> "https://wa.me/212524000102" */
function whatsappLink(phone) {
  return `https://wa.me/${String(phone).replace(/\D/g, '')}`
}

/**
 * Where and when: pick-up or return agency with its address, hours, phone and a
 * WhatsApp link. `caption` is "Prise en charge" or "Restitution", `when` the moment.
 */
export default function AgencyDetails({ caption, when, location, className }) {
  return (
    <section
      aria-label={caption}
      className={cn(
        'flex flex-col gap-3 rounded-card border border-line bg-surface p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-fg-muted">{caption}</p>
        <p className="text-lg font-bold text-fg tabular-nums">{when}</p>
        <p className="font-semibold text-fg">{location.name}</p>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-fg-muted">
        <li className="flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <span>{location.address}</span>
        </li>
        {location.opening_hours && (
          <li className="flex gap-2.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <span>
              <span className="sr-only">Horaires : </span>
              {location.opening_hours}
            </span>
          </li>
        )}
      </ul>
      {location.phone && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a
            href={`tel:${location.phone}`}
            className="link-underline touch-target inline-flex items-center gap-2 rounded-xs font-semibold text-fg tabular-nums"
          >
            <Phone className="size-4 text-fg-subtle" aria-hidden="true" />
            {formatPhone(location.phone)}
          </a>
          <a
            href={whatsappLink(location.phone)}
            target="_blank"
            rel="noreferrer"
            className="link-underline touch-target inline-flex items-center gap-2 rounded-xs font-semibold text-fg"
          >
            <WhatsAppIcon className="size-4 text-success" />
            WhatsApp
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </div>
      )}
    </section>
  )
}
