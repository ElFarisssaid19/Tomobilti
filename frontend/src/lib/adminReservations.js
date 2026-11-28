import { CircleCheck, CircleX, Flag, KeyRound, Ban } from 'lucide-react'
import { ADMIN_RESERVATION_TAB, RESERVATION_STATUS } from './labels.js'

/*
 * Back-office reservations: list filters (in the URL) and the actions allowed per
 * status. The actions mirror ReservationStatus::allowedTransitions() on the server,
 * which stays the judge: a refused move answers 403 or 409 with the French reason.
 */

/** URL parameters of /admin/reservations (GET /api/admin/reservations: `onglet` is `tab`). */
export const RESERVATION_FILTERS = Object.freeze({
  onglet: {
    type: 'enum',
    values: Object.keys(ADMIN_RESERVATION_TAB),
    default: 'pending',
    apiKey: 'tab',
  },
  status: { type: 'list', values: Object.keys(RESERVATION_STATUS) },
  from: { type: 'date' },
  to: { type: 'date' },
  location: { type: 'id' },
  car: { type: 'id' },
  q: { type: 'string' },
  sort: { type: 'enum', values: ['start_at', 'end_at', 'created_at', 'total', 'reference'] },
  direction: { type: 'enum', values: ['asc', 'desc'] },
  page: { type: 'page' },
})

/**
 * Every action the agency can take. `variant`: the button (one lime primary per
 * status); `tone: 'danger'`: the confirm button of its dialog is red. `reason`: the
 * action needs a reason, shown to the customer. `payment`: the action asks how the
 * customer pays (PaymentDialog), since the invoice is issued at pick-up.
 */
export const RESERVATION_ACTIONS = {
  confirm: {
    label: 'Confirmer',
    icon: CircleCheck,
    variant: 'primary',
    title: 'Confirmer cette réservation ?',
    description: 'La voiture est réservée pour ces dates et le client voit « Confirmée ».',
  },
  pickUp: {
    label: 'Marquer comme récupérée',
    icon: KeyRound,
    variant: 'primary',
    payment: true,
    title: 'Le client a récupéré la voiture ?',
    description: 'La location passe « En cours ». La facture est créée et envoyée au client.',
  },
  return: {
    label: 'Marquer comme rendue',
    icon: Flag,
    variant: 'primary',
    title: 'La voiture est rendue ?',
    description: 'La location est terminée et la voiture redevient disponible.',
  },
  reject: {
    label: 'Refuser',
    icon: CircleX,
    variant: 'secondary',
    tone: 'danger',
    reason: true,
    title: 'Refuser cette demande ?',
    description: 'Le client verra le motif sur sa réservation.',
    reasonLabel: 'Motif du refus',
    reasonPlaceholder: 'Par exemple : permis de conduire de moins de 2 ans.',
  },
  cancel: {
    label: 'Annuler',
    icon: Ban,
    variant: 'secondary',
    tone: 'danger',
    reason: true,
    title: 'Annuler cette réservation ?',
    description: 'La voiture redevient libre pour ces dates. Le client verra le motif.',
    reasonLabel: 'Motif de l’annulation',
    reasonPlaceholder: 'Par exemple : véhicule immobilisé pour un entretien imprévu.',
    confirmLabel: 'Annuler la réservation',
  },
}

/** Actions allowed for a status, in display order (the primary one first). */
const ACTIONS_BY_STATUS = {
  pending: ['confirm', 'reject', 'cancel'],
  confirmed: ['pickUp', 'cancel'],
  active: ['return'],
}

/** @returns {string[]} keys of RESERVATION_ACTIONS */
export function actionsForStatus(status) {
  return ACTIONS_BY_STATUS[status] ?? []
}

/** Minimum length of a reason (the server asks for 3 characters). */
export const MIN_REASON_LENGTH = 3
