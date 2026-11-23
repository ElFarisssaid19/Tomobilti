import { rentalDays } from './dates.js'

/**
 * Estimated rental price for display: days × price per day (rounded to the centime).
 * Extras are not included and the deposit is never part of it. The backend computes
 * the real total when booking (Phase 4).
 * @param {string|number} pricePerDay "250.00" from the API
 * @param {{ from?: Date|string, to?: Date|string }} range
 * @returns {{ days: number, total: number } | null} null without a complete range
 */
export function estimateRental(pricePerDay, range) {
  const days = rentalDays(range)
  const price = Number(pricePerDay)
  if (!days || !Number.isFinite(price)) return null
  return { days, total: Math.round(price * days * 100) / 100 }
}
