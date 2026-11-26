import { subHours } from 'date-fns'
import DocumentsToBring from '../../components/reservation/DocumentsToBring.jsx'
import PriceBreakdown from '../../components/reservation/PriceBreakdown.jsx'
import RentalTerms from '../../components/reservation/RentalTerms.jsx'
import { Checkbox, Skeleton, Textarea } from '../../components/ui'
import { combineDateTime, draftMoment } from '../../lib/booking.js'
import { formatDate } from '../../utils/format.js'

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

      <Block title="Bon à savoir">
        <RentalTerms
          freeUntilLabel={
            freeUntil
              ? `${formatDate(freeUntil, { day: 'numeric', month: 'long' })} à ${draft.pickupTime}`
              : undefined
          }
        />
      </Block>

      <Block title="Documents à présenter">
        <DocumentsToBring />
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
