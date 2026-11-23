import { useCallback, useEffect, useState } from 'react'
import { datesStepErrors, emptyDraft } from '../lib/booking.js'
import { toDay } from '../lib/dates.js'

export const BOOKING_DRAFT_KEY = 'tomobilti.booking-draft'

function readDraft() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(BOOKING_DRAFT_KEY))
    return stored && typeof stored === 'object' ? stored : null
  } catch {
    return null
  }
}

function writeDraft(draft) {
  try {
    if (draft) window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft))
    else window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {
    // Private mode or storage full: the booking still works, it is just not kept.
  }
}

/**
 * The booking in progress, kept in sessionStorage so a refresh or the login detour
 * does not lose it (one draft per tab, for one car). Dates in the URL (from the car
 * page) win over the saved ones. A restored draft goes back to the first step whose
 * dates are no longer valid (e.g. the pick-up time has passed).
 *
 * @returns {[object, (patch: object | ((draft: object) => object)) => void, () => void]}
 */
export default function useBookingDraft(slug, urlDates = {}) {
  const [draft, setDraft] = useState(() => {
    const stored = readDraft()
    let initial = stored?.slug === slug ? { ...emptyDraft(slug), ...stored } : emptyDraft(slug)

    const from = toDay(urlDates.from)
    const to = toDay(urlDates.to)
    if (from && to && to > from && (urlDates.from !== initial.from || urlDates.to !== initial.to)) {
      initial = { ...initial, from: urlDates.from, to: urlDates.to }
    }

    if (initial.step > 0 && Object.keys(datesStepErrors(initial)).length > 0) {
      initial = { ...initial, step: 0 }
    }
    return initial
  })

  useEffect(() => {
    writeDraft(draft)
  }, [draft])

  const update = useCallback((patch) => {
    setDraft((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }))
  }, [])

  const clear = useCallback(() => writeDraft(null), [])

  return [draft, update, clear]
}
