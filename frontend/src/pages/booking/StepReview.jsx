import { subHours } from 'date-fns'
import { CalendarX2, Wallet } from 'lucide-react'
import DocumentsToBring from '../../components/reservation/DocumentsToBring.jsx'
import PriceBreakdown from '../../components/reservation/PriceBreakdown.jsx'
import { Checkbox, Skeleton, Textarea } from '../../components/ui'
import { combineDateTime, draftMoment } from '../../lib/booking.js'
import { formatDate, formatPrice } from '../../utils/format.js'

/**
 * Step 4: everything the customer commits to before confirming. The prices are the
 * server's quote; payment and deposit happen at the agency.
 */
export default function StepReview({
  car,
  draft,
  update,
  rules,
  locationName,
  quote,
  termsAccepted,
  onTermsChange,
  errors,
}) {
  const start = combineDateTime(draft.from, draft.pickupTime)
  const freeUntil = start ? subHours(start, rules.free_cancellation_hours) : null

  return (
    <div className="flex flex-col gap-8">
      <Block title="Votre location">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Item label="Voiture" value={`${car.name} ${car.year}`} />
          <Item label="Catégorie" value={car.category?.name} />
          <Item
            label="Prise en charge"
            value={draftMoment(draft.from, draft.pickupTime, { long: true })}
            detail={locationName(draft.pickupLocation)}
          />
          <Item
            label="Restitution"
            value={draftMoment(draft.to, draft.returnTime, { long: true })}
            detail={locationName(draft.returnLocation)}
          />
        </dl>
      </Block>

      <Block title="Prix">
        {quote ? (
          <PriceBreakdown pricing={quote.pricing} />
        ) : (
          <Skeleton className="h-32 rounded-card" />
        )}
      </Block>

      <Block title="Paiement et caution">
        <div className="flex gap-3 text-sm text-fg-muted">
          <Wallet className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
          <p>
            <span className="font-semibold text-fg">
              Paiement à l’agence lors de la prise en charge
            </span>
            , en espèces ou par carte. La caution
            {quote ? ` de ${formatPrice(quote.pricing.deposit_amount)}` : ''} est bloquée sur votre
            carte bancaire et libérée au retour de la voiture.
          </p>
        </div>
      </Block>

      <Block title="Documents à présenter">
        <DocumentsToBring />
      </Block>

      <Block title="Annulation">
        <div className="flex gap-3 text-sm text-fg-muted">
          <CalendarX2 className="mt-0.5 size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
          <p>
            Annulation gratuite depuis Mes réservations jusqu’à {rules.free_cancellation_hours} h
            avant la prise en charge
            {freeUntil
              ? `, soit jusqu’au ${formatDate(freeUntil, { day: 'numeric', month: 'long' })} à ${draft.pickupTime}`
              : ''}
            . Ensuite, contactez l’agence.
          </p>
        </div>
      </Block>

      <Textarea
        label="Remarques pour l’agence"
        name="customer_notes"
        rows={3}
        maxLength={1000}
        placeholder="Numéro de vol, heure d’arrivée, besoin particulier…"
        hint="Facultatif."
        value={draft.notes}
        onChange={(event) => update({ notes: event.target.value })}
      />

      <Checkbox
        name="terms"
        label="J’accepte les conditions générales de location"
        hint="Âge minimum 21 ans, 2 ans de permis, caution bloquée à la prise en charge."
        checked={termsAccepted}
        onChange={onTermsChange}
        error={errors.terms}
      />
    </div>
  )
}

function Block({ title, children }) {
  return (
    <section className="flex flex-col gap-4 border-b border-line pb-8 last:border-0">
      <h3 className="text-lg font-bold text-fg">{title}</h3>
      {children}
    </section>
  )
}

function Item({ label, value, detail }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="font-semibold text-fg tabular-nums first-letter:uppercase">{value}</dd>
      {detail && <dd className="text-fg-muted">{detail}</dd>}
    </div>
  )
}
