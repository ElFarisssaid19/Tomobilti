/*
 * French labels for the backend enums (backend/app/Enums, see docs/database.md).
 * Keys are the exact enum values sent by the API. Never hard-code these labels in
 * components: import them from here.
 */

export const USER_ROLE = {
  admin: 'Administrateur',
  client: 'Client',
}

export const RESERVATION_STATUS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  active: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  rejected: 'Refusée',
}

/** Tabs of "Mes réservations" (backend ReservationTab), in display order. */
export const RESERVATION_TAB = {
  upcoming: 'À venir',
  current: 'En cours',
  past: 'Passées',
  cancelled: 'Annulées',
}

/** Tabs of the back-office reservations list (backend AdminReservationTab), in display order. */
export const ADMIN_RESERVATION_TAB = {
  pending: 'À traiter',
  today: 'Aujourd’hui',
  active: 'En cours',
  all: 'Toutes',
}

export const TRANSMISSION = {
  manual: 'Manuelle',
  automatic: 'Automatique',
}

export const FUEL_TYPE = {
  diesel: 'Diesel',
  petrol: 'Essence',
  hybrid: 'Hybride',
  electric: 'Électrique',
}

export const CAR_STATUS = {
  available: 'Disponible',
  maintenance: 'En maintenance',
  out_of_service: 'Hors service',
}

export const LOCATION_TYPE = {
  airport: 'Aéroport',
  agency: 'Agence',
}

export const EXTRA_PRICING = {
  per_day: 'Par jour',
  per_rental: 'Par location',
}

export const INVOICE_STATUS = {
  unpaid: 'Non payée',
  paid: 'Payée',
}

export const PAYMENT_METHOD = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  bank_transfer: 'Virement bancaire',
}

/** Look up a label, falling back to the raw value so unknown values stay visible. */
export function label(map, value) {
  return map[value] ?? value ?? ''
}

/** `[{ value, label }]` list for selects and chip groups, in declaration order. */
export function toOptions(map) {
  return Object.entries(map).map(([value, text]) => ({ value, label: text }))
}
