import { describe, expect, it } from 'vitest'
import { rentalDays } from './dates.js'
import { label, RESERVATION_STATUS, toOptions, TRANSMISSION } from './labels.js'
import { getFieldError, getValidationErrors } from './validation.js'

const payload = { message: 'Erreur', errors: { email: ['Obligatoire.', 'Invalide.'] } }

describe('validation', () => {
  it('reads the errors object from an axios error, a payload or the object itself', () => {
    expect(getValidationErrors({ response: { data: payload } })).toEqual(payload.errors)
    expect(getValidationErrors(payload)).toEqual(payload.errors)
    expect(getValidationErrors(payload.errors)).toEqual(payload.errors)
    expect(getValidationErrors({ response: { data: { message: 'Erreur serveur' } } })).toEqual({})
  })

  it('returns the first message of a field', () => {
    expect(getFieldError(payload, 'email')).toBe('Obligatoire.')
    expect(getFieldError(payload, 'phone')).toBeUndefined()
    expect(getFieldError(null, 'email')).toBeUndefined()
  })
})

describe('labels', () => {
  it('maps backend enum values to French labels', () => {
    expect(label(RESERVATION_STATUS, 'confirmed')).toBe('Confirmée')
    expect(label(TRANSMISSION, 'automatic')).toBe('Automatique')
    expect(label(TRANSMISSION, 'unknown')).toBe('unknown')
  })

  it('builds select options in declaration order', () => {
    expect(toOptions(TRANSMISSION)).toEqual([
      { value: 'manual', label: 'Manuelle' },
      { value: 'automatic', label: 'Automatique' },
    ])
  })
})

describe('rentalDays', () => {
  it('counts one day per night, at least one', () => {
    expect(rentalDays({ from: '2026-12-12', to: '2026-12-15' })).toBe(3)
    expect(rentalDays({ from: '2026-12-12', to: '2026-12-12' })).toBe(1)
    expect(rentalDays({ from: '2026-12-12' })).toBe(0)
  })
})
