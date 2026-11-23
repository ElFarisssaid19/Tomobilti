import { CreditCard, IdCard, ScrollText } from 'lucide-react'
import { DOCUMENTS_TO_BRING } from '../../lib/booking.js'
import { cn } from '../../lib/cn.js'

const ICONS = [IdCard, ScrollText, CreditCard]

/** What to show at the counter on pick-up day: ID, licence, card for the deposit. */
export default function DocumentsToBring({ className }) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {DOCUMENTS_TO_BRING.map((document, index) => {
        const Icon = ICONS[index]
        return (
          <li key={document.label} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-raised text-fg">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-fg">{document.label}</span>
              <span className="text-sm text-fg-muted">{document.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
