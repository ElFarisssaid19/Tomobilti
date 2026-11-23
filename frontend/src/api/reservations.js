import api from './client.js'

/*
 * Reservation endpoints (backend/routes/api.php, "Reservations"). The server computes
 * every price: the SPA never sends a total, only the customer's choices.
 */

/** GET /api/booking-rules -> { opening_time, closing_time, slot_minutes, min_lead_hours, … } */
export async function fetchBookingRules({ signal } = {}) {
  const { data } = await api.get('/api/booking-rules', { signal })
  return data.data
}

/**
 * POST /api/reservations/quote { car, start_at, end_at, pickup_location, return_location, extras }
 * -> { car, pricing, available, unavailable_message, eligibility, can_book, … }
 */
export async function quoteReservation(payload, { signal } = {}) {
  const { data } = await api.post('/api/reservations/quote', payload, { signal })
  return data.data
}

/** POST /api/reservations (quote input + customer_notes, terms) -> { reservation, message } */
export async function createReservation(payload) {
  const { data } = await api.post('/api/reservations', payload)
  return { reservation: data.data, message: data.message }
}

/** GET /api/reservations?tab&page -> { data, meta: { counts, current_page, last_page, … } } */
export async function fetchReservations(params, { signal } = {}) {
  const { data } = await api.get('/api/reservations', { params, signal })
  return data
}

/** GET /api/reservations/{reference} -> reservation with pricing, timeline, cancellation */
export async function fetchReservation(reference, { signal } = {}) {
  const { data } = await api.get(`/api/reservations/${encodeURIComponent(reference)}`, { signal })
  return data.data
}

/** POST /api/reservations/{reference}/cancel { reason? } -> { reservation, message } */
export async function cancelReservation(reference, reason) {
  const { data } = await api.post(`/api/reservations/${encodeURIComponent(reference)}/cancel`, {
    reason: reason || null,
  })
  return { reservation: data.data, message: data.message }
}
