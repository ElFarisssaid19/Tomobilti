import { Banknote, CalendarX2, ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { formatDate, formatPrice } from '../../utils/format.js'

/**
 * What the customer must know, as short bullet points (DESIGN.md, "Texte et ton"):
 * payment at the agency, the deposit and the free cancellation deadline. Used by the
 * booking recap and the reservation detail, so both say the same. The documents to
 * bring are `DocumentsToBring`.
 *
 * @param {string|number} [deposit] deposit amount, when no PriceBreakdown shows it nearby
 * @param {Date|string} [freeUntil] end of the free cancellation, from the server
 * @param {string} [freeUntilLabel] the same, already formatted ("12 décembre à 10:00")
 */
export default function RentalTerms({ deposit, freeUntil, freeUntilLabel, className }) {
  const cancelBy =
    freeUntilLabel ??
    (freeUntil
      ? `${formatDate(freeUntil, { day: 'numeric', month: 'long' })} à ${formatDate(freeUntil, { hour: '2-digit', minute: '2-digit' })}`
      : null)

  const items = [
    { icon: Banknote, text: 'Paiement à l’agence, en espèces ou par carte' },
    {
      icon: ShieldCheck,
      text:
        deposit !== undefined && deposit !== null
          ? `Caution de ${formatPrice(deposit)} bloquée sur votre carte, libérée au retour`
          : 'Caution bloquée sur votre carte, libérée au retour',
    },
    cancelBy && { icon: CalendarX2, text: `Annulation gratuite jusqu’au ${cancelBy}` },
  ].filter(Boolean)

  return (
    <ul className={cn('flex flex-col gap-2.5 text-sm text-fg-muted', className)}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-start gap-2.5">
          <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}
