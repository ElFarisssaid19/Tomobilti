import { describe, expect, it } from 'vitest'
import { formatDate, formatPhone, formatPrice } from './format.js'

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

describe('formatPhone', () => {
  it('groups a Moroccan E.164 number like the PDFs and emails', () => {
    expect(formatPhone('+212524000101')).toBe('+212 5 24 00 01 01')
    expect(formatPhone('+212661234567')).toBe('+212 6 61 23 45 67')
  })

  it('returns other values unchanged', () => {
    expect(formatPhone('+33612345678')).toBe('+33612345678')
    expect(formatPhone(null)).toBe('')
  })
})
