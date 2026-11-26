import { CreditCard, IdCard, ScrollText } from 'lucide-react'
import { DOCUMENTS_TO_BRING } from '../../lib/booking.js'
import { cn } from '../../lib/cn.js'

const ICONS = [IdCard, ScrollText, CreditCard]

/** What to show at the counter on pick-up day, one short bullet each (ID, licence, card). */
export default function DocumentsToBring({ className }) {
  return (
    <ul className={cn('flex flex-col gap-2.5 text-sm text-fg-muted', className)}>
      {DOCUMENTS_TO_BRING.map((document, index) => {
        const Icon = ICONS[index]
        return (
          <li key={document.label} className="flex items-start gap-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
            <span>
              <span className="font-semibold text-fg">{document.label}</span>, {document.detail}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
