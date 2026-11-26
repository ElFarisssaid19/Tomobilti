import { addHours } from 'date-fns'
import SimilarAvailableCars from '../../components/reservation/SimilarAvailableCars.jsx'
import { Alert, DateRangePicker, Select } from '../../components/ui'
import { useCarAvailability } from '../../hooks/useCatalog.js'
import {
  agencyNow,
  combineDateTime,
  draftToRange,
  rangeToDraft,
  timeSlots,
} from '../../lib/booking.js'
import { toInputDate } from '../../lib/dates.js'
import { formatPrice } from '../../utils/format.js'

/**
 * Step 1: dates (booked days struck through), pick-up and return times in 30-minute
 * slots, pick-up and return agencies. The one-way fee is announced when they differ.
 */
export default function StepDates({ car, draft, update, rules, locations, errors, quote }) {
  const availability = useCarAvailability(car.slug)
  const unavailable = availability.data?.unavailable ?? []
  const slots = timeSlots(rules)
  const earliest = addHours(agencyNow(), rules.min_lead_hours)
  const today = toInputDate(agencyNow())

  const pickupOptions = slots.map((time) => ({
    value: time,
    label: time,
    disabled: draft.from === today && combineDateTime(draft.from, time) < earliest,
  }))
  const returnOptions = slots.map((time) => ({ value: time, label: time }))
  const locationOptions = locations.map((location) => ({
    value: location.slug,
    label: location.name,
  }))
  const oneWay =
    draft.pickupLocation && draft.returnLocation && draft.pickupLocation !== draft.returnLocation

  return (
    <div className="flex flex-col gap-6">
      <DateRangePicker
        label="Dates de location"
        name="dates"
        value={draftToRange(draft)}
        onChange={(range) => update(rangeToDraft(range))}
        unavailable={unavailable}
        maxDays={rules.max_days}
        error={errors.dates}
        hint={
          availability.isPending
            ? 'Chargement des jours déjà réservés…'
            : unavailable.length > 0
              ? 'Les jours barrés sont déjà réservés.'
              : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Heure de prise en charge"
          name="pickup_time"
          options={pickupOptions}
          value={draft.pickupTime}
          onChange={(pickupTime) => update({ pickupTime })}
          error={errors.pickupTime}
          hint={`Entre ${rules.opening_time} et ${rules.closing_time}, au moins ${rules.min_lead_hours} h à l’avance.`}
        />
        <Select
          label="Heure de restitution"
          name="return_time"
          options={returnOptions}
          value={draft.returnTime}
          onChange={(returnTime) => update({ returnTime })}
          error={errors.returnTime}
          info="Chaque tranche de 24 h commencée compte pour un jour."
        />
        <Select
          label="Agence de prise en charge"
          name="pickup_location"
          options={locationOptions}
          value={draft.pickupLocation}
          onChange={(pickupLocation) => update({ pickupLocation })}
          error={errors.pickupLocation}
        />
        <Select
          label="Agence de restitution"
          name="return_location"
          options={locationOptions}
          value={draft.returnLocation}
          onChange={(returnLocation) => update({ returnLocation })}
          error={errors.returnLocation}
        />
      </div>

      {oneWay && (
        <Alert tone="info" title="Retour dans une autre agence">
          {formatPrice(rules.one_way_fee)} de frais s’ajoutent au total.
        </Alert>
      )}

      {errors.availability && quote && (
        <div className="flex flex-col gap-6">
          <Alert tone="warning" title="Voiture indisponible sur ces horaires">
            {errors.availability}
          </Alert>
          <SimilarAvailableCars car={car} from={draft.from} to={draft.to} />
        </div>
      )}
    </div>
  )
}
