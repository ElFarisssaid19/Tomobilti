import { describe, expect, it } from 'vitest'
import {
  billedDays,
  datesStepErrors,
  emptyDraft,
  quotePayload,
  stepErrors,
  timeSlots,
} from './booking.js'

const NOW = new Date(2026, 11, 1, 9, 0) // 1 Dec 2026, 09:00 agency time

function draft(overrides = {}) {
  return {
    ...emptyDraft('clio'),
    from: '2026-12-10',
    to: '2026-12-13',
    pickupTime: '10:00',
    returnTime: '12:00',
    pickupLocation: 'marrakech-gueliz',
    returnLocation: 'agadir',
    extras: { gps: 1, 'siege-bebe': 0 },
    ...overrides,
  }
}

describe('booking helpers', () => {
  it('offers 30-minute slots from 08:00 to 20:00', () => {
    const slots = timeSlots()
    expect(slots).toHaveLength(25)
    expect(slots.slice(0, 3)).toEqual(['08:00', '08:30', '09:00'])
    expect(slots.at(-1)).toBe('20:00')
  })

  it('counts every started 24 hours as a day, like the server', () => {
    expect(billedDays(new Date(2026, 11, 10, 10), new Date(2026, 11, 11, 10))).toBe(1)
    expect(billedDays(new Date(2026, 11, 10, 10), new Date(2026, 11, 11, 10, 30))).toBe(2)
    expect(billedDays(new Date(2026, 11, 10, 9), new Date(2026, 11, 10, 18))).toBe(1)
  })

  it('sends only the choices to the quote, never a price, and skips options at 0', () => {
    expect(quotePayload(draft())).toEqual({
      car: 'clio',
      start_at: '2026-12-10 10:00',
      end_at: '2026-12-13 12:00',
      pickup_location: 'marrakech-gueliz',
      return_location: 'agadir',
      extras: [{ slug: 'gps', quantity: 1 }],
    })
    expect(quotePayload(draft({ to: null }))).toBeNull()
    expect(quotePayload(draft({ returnLocation: null }))).toBeNull()
  })

  it('checks the dates step: dates, lead time, order and availability', () => {
    expect(datesStepErrors(draft(), { now: NOW })).toEqual({})
    expect(datesStepErrors(draft({ from: null }), { now: NOW }).dates).toBe(
      'Choisissez vos dates de prise en charge et de restitution.',
    )
    expect(
      datesStepErrors(draft({ from: '2026-12-01', pickupTime: '10:30' }), { now: NOW }).pickupTime,
    ).toBe('La prise en charge doit avoir lieu au moins 2 heures après la réservation.')
    expect(
      datesStepErrors(draft({ from: '2026-12-01', to: '2027-01-15' }), { now: NOW }).dates,
    ).toBe('La location ne peut pas dépasser 30 jours.')
    expect(
      datesStepErrors(draft(), {
        now: NOW,
        quote: { available: false, unavailable_message: 'Déjà réservée.' },
      }).availability,
    ).toBe('Déjà réservée.')
  })

  it('needs the server to accept the profile, then the terms', () => {
    const blocked = {
      eligibility: { eligible: false, reasons: [{ code: 'under_age', message: 'Trop jeune.' }] },
    }
    expect(stepErrors(1, draft())).toEqual({})
    expect(stepErrors(2, draft(), { quote: blocked })).toEqual({ eligibility: 'Trop jeune.' })
    expect(
      stepErrors(2, draft(), { quote: { eligibility: { eligible: true, reasons: [] } } }),
    ).toEqual({})
    expect(stepErrors(3, draft(), { termsAccepted: false }).terms).toBe(
      'Vous devez accepter les conditions générales de location.',
    )
    expect(stepErrors(3, draft(), { termsAccepted: true })).toEqual({})
  })
})
