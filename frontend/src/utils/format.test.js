import { describe, expect, it } from 'vitest'
import { formatDate, formatPrice } from './format.js'

// Intl may use (narrow) no-break spaces: normalise all whitespace for stable assertions.
const normalize = (value) => value.replace(/\s/g, ' ')

describe('formatPrice', () => {
  it('formats amounts in Moroccan dirhams', () => {
    expect(normalize(formatPrice(450))).toContain('450')
    expect(normalize(formatPrice(450))).toMatch(/MAD|DH/)
  })

  it('shows two decimals only when needed', () => {
    expect(normalize(formatPrice(450))).not.toContain(',')
    expect(normalize(formatPrice(1234.5))).toContain(',50')
  })

  it('returns an empty string for invalid values', () => {
    expect(formatPrice('abc')).toBe('')
    expect(formatPrice(undefined)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats dates in French', () => {
    expect(formatDate('2026-11-21T10:00:00Z')).toBe('21 novembre 2026')
  })

  it('returns an empty string for empty or invalid dates', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('not a date')).toBe('')
  })
})
