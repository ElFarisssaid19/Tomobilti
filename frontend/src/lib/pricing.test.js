import { describe, expect, it } from 'vitest'
import { overlapsUnavailable } from './dates.js'
import { estimateRental } from './pricing.js'

describe('estimateRental', () => {
  it('multiplies the price per day by the number of days', () => {
    expect(estimateRental('250.00', { from: '2026-12-20', to: '2026-12-27' })).toEqual({
      days: 7,
      total: 1750,
    })
  })

  it('counts at least one day and keeps the centimes', () => {
    expect(estimateRental('449.50', { from: '2026-12-20', to: '2026-12-22' })).toEqual({
      days: 2,
      total: 899,
    })
    expect(estimateRental(300, { from: '2026-12-20', to: '2026-12-20' })).toEqual({
      days: 1,
      total: 300,
    })
  })

  it('returns null without a complete range', () => {
    expect(estimateRental('250.00', { from: '2026-12-20' })).toBeNull()
    expect(estimateRental('250.00', undefined)).toBeNull()
  })
})

describe('overlapsUnavailable', () => {
  const booked = [{ from: '2026-12-10', to: '2026-12-14' }]

  it('detects a range touching a booked day', () => {
    expect(overlapsUnavailable({ from: '2026-12-14', to: '2026-12-16' }, booked)).toBe(true)
    expect(overlapsUnavailable({ from: '2026-12-05', to: '2026-12-20' }, booked)).toBe(true)
  })

  it('accepts a range around the booked days', () => {
    expect(overlapsUnavailable({ from: '2026-12-15', to: '2026-12-18' }, booked)).toBe(false)
    expect(overlapsUnavailable({ from: '2026-12-01', to: '2026-12-09' }, booked)).toBe(false)
  })
})
