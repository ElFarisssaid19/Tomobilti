import { addHours, addMonths, isValid, parse } from 'date-fns'
import { formatDate } from '../utils/format.js'
import { toDay, toInputDate } from './dates.js'

/*
 * Booking flow helpers (/reserver/:slug). The rules mirror config/tomobilti.php
 * ("booking", sent by GET /api/booking-rules). These checks only save a round trip:
 * the server validates everything again and computes every price.
 */

export const BOOKING_STEPS = ['Dates et agences', 'Options', 'Informations', 'Récapitulatif']

/** Used until GET /api/booking-rules answers (same values as the backend config). */
export const DEFAULT_BOOKING_RULES = {
  opening_time: '08:00',
  closing_time: '20:00',
  slot_minutes: 30,
  min_lead_hours: 2,
  max_advance_months: 6,
  min_days: 1,
  max_days: 30,
  min_age: 21,
  min_license_years: 2,
  free_cancellation_hours: 24,
  one_way_fee: '300.00',
}

export const DOCUMENTS_TO_BRING = [
  { label: 'CIN ou passeport', detail: 'en cours de validité' },
  { label: 'Permis de conduire', detail: 'original, 2 ans minimum' },
  { label: 'Carte bancaire', detail: 'au nom du conducteur, pour la caution' },
]

export const DEFAULT_TIME = '10:00'

const AGENCY_TIME_ZONE = 'Africa/Casablanca'

function minutesOf(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function timeOf(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/** "08:00", "08:30" … "20:00": the pick-up and return times offered at the counter. */
export function timeSlots(rules = DEFAULT_BOOKING_RULES) {
  const slots = []
  for (
    let minutes = minutesOf(rules.opening_time);
    minutes <= minutesOf(rules.closing_time);
    minutes += rules.slot_minutes
  ) {
    slots.push(timeOf(minutes))
  }
  return slots
}

/**
 * The agency's wall-clock time now (Africa/Casablanca), as a local Date, so it can
 * be compared with the dates and times the customer picks whatever their timezone.
 */
export function agencyNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: AGENCY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  )
}

/** "2026-12-10" + "10:00" -> local Date, or undefined. */
export function combineDateTime(day, time) {
  if (!day || !time) return undefined
  const date = parse(`${day} ${time}`, 'yyyy-MM-dd HH:mm', new Date())
  return isValid(date) ? date : undefined
}

/** Billed days, same rule as the server: every started 24 hours counts, minimum 1. */
export function billedDays(start, end) {
  if (!start || !end || end <= start) return 0
  return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)))
}

/** An empty booking for a car. Dates are "YYYY-MM-DD" strings (agency time). */
export function emptyDraft(slug) {
  return {
    slug,
    from: null,
    to: null,
    pickupTime: DEFAULT_TIME,
    returnTime: DEFAULT_TIME,
    pickupLocation: null,
    returnLocation: null,
    extras: {},
    notes: '',
    step: 0,
  }
}

/** `{ from, to }` of DayPicker -> the draft's "YYYY-MM-DD" fields. */
export function rangeToDraft(range) {
  return {
    from: range?.from ? toInputDate(range.from) : null,
    to: range?.to ? toInputDate(range.to) : null,
  }
}

/** The draft's dates -> DayPicker range, or undefined. */
export function draftToRange(draft) {
  const from = toDay(draft.from)
  const to = toDay(draft.to)
  return from ? { from, to } : undefined
}

/** Body of POST /api/reservations/quote, or null while a choice is missing. */
export function quotePayload(draft) {
  if (!draft.from || !draft.to || !draft.pickupTime || !draft.returnTime) return null
  if (!draft.pickupLocation || !draft.returnLocation) return null
  return {
    car: draft.slug,
    start_at: `${draft.from} ${draft.pickupTime}`,
    end_at: `${draft.to} ${draft.returnTime}`,
    pickup_location: draft.pickupLocation,
    return_location: draft.returnLocation,
    extras: Object.entries(draft.extras)
      .filter(([, quantity]) => quantity > 0)
      .map(([slug, quantity]) => ({ slug, quantity })),
  }
}

/**
 * Errors of the "Dates et agences" step, as `{ field: message }` (empty when valid).
 * `quote` is the server's answer for these choices, when there is one.
 */
export function datesStepErrors(draft, { rules = DEFAULT_BOOKING_RULES, quote, now } = {}) {
  const errors = {}
  if (!draft.from || !draft.to) {
    errors.dates = 'Choisissez vos dates de prise en charge et de restitution.'
  }
  if (!draft.pickupLocation) errors.pickupLocation = 'Choisissez l’agence de prise en charge.'
  if (!draft.returnLocation) errors.returnLocation = 'Choisissez l’agence de restitution.'
  if (errors.dates) return errors

  const start = combineDateTime(draft.from, draft.pickupTime)
  const end = combineDateTime(draft.to, draft.returnTime)
  const current = now ?? agencyNow()

  if (!start || start < addHours(current, rules.min_lead_hours)) {
    errors.pickupTime = `La prise en charge doit avoir lieu au moins ${rules.min_lead_hours} heures après la réservation.`
  } else if (start > addMonths(current, rules.max_advance_months)) {
    errors.dates = `Vous pouvez réserver au maximum ${rules.max_advance_months} mois à l’avance.`
  }

  if (!end || !start || end <= start) {
    errors.returnTime = 'La restitution doit avoir lieu après la prise en charge.'
  } else if (billedDays(start, end) > rules.max_days) {
    errors.dates = `La location ne peut pas dépasser ${rules.max_days} jours.`
  }

  if (Object.keys(errors).length === 0 && quote && quote.available === false) {
    errors.availability = quote.unavailable_message
  }
  return errors
}

/**
 * Errors that keep the customer on a step (empty object when they can continue).
 * Step 0: dates and agencies. Step 1: options (always valid, quantities are bounded).
 * Step 2: the server says the customer can book. Step 3: terms accepted.
 */
export function stepErrors(step, draft, { rules, quote, now, termsAccepted } = {}) {
  if (step === 0) return datesStepErrors(draft, { rules, quote, now })
  if (step === 2) {
    if (!quote?.eligibility) return { eligibility: 'Vérification de votre profil…' }
    return quote.eligibility.eligible
      ? {}
      : { eligibility: quote.eligibility.reasons[0]?.message ?? 'Profil incomplet.' }
  }
  if (step === 3 && !termsAccepted) {
    return { terms: 'Vous devez accepter les conditions générales de location.' }
  }
  return {}
}

/** First step whose checks fail (used to restore a saved draft safely). */
export function firstBlockedStep(draft, context, upTo = draft.step) {
  for (let step = 0; step < upTo; step += 1) {
    if (Object.keys(stepErrors(step, draft, context)).length > 0) return step
  }
  return upTo
}

const SHORT_DAY = { weekday: 'short', day: 'numeric', month: 'short' }
const DAY_WITH_YEAR = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

/** "jeu. 10 déc., 10:00" from the draft's "YYYY-MM-DD" and "HH:MM" (agency time). */
export function draftMoment(day, time, { long = false } = {}) {
  if (!day) return 'À choisir'
  return long
    ? `${formatDate(day, DAY_WITH_YEAR)} à ${time}`
    : `${formatDate(day, SHORT_DAY)}, ${time}`
}

/** "jeudi 10 décembre 2026 à 10:00" from an ISO date-time sent by the API. */
export function formatMoment(iso) {
  return `${formatDate(iso, DAY_WITH_YEAR)} à ${formatDate(iso, { hour: '2-digit', minute: '2-digit' })}`
}

/** "10 déc. – 13 déc. 2026" for a row of "Mes réservations". */
export function formatPeriod(startIso, endIso) {
  return `${formatDate(startIso, { day: 'numeric', month: 'short' })} – ${formatDate(endIso, { day: 'numeric', month: 'short', year: 'numeric' })}`
}
