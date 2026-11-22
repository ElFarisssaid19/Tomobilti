import { useSyncExternalStore } from 'react'

/** Ignore jitter: the direction only changes after this many pixels. */
const TOLERANCE = 8

let lastY = 0
let direction = 'up'

function subscribe(onChange) {
  lastY = window.scrollY

  function handleScroll() {
    const y = window.scrollY
    if (Math.abs(y - lastY) < TOLERANCE) return
    const next = y > lastY ? 'down' : 'up'
    lastY = y
    if (next !== direction) {
      direction = next
      onChange()
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}

/**
 * Last scroll direction of the window: 'up' or 'down' (used to tuck the navbar away
 * while reading and bring it back as soon as the user scrolls up).
 */
export default function useScrollDirection() {
  return useSyncExternalStore(
    subscribe,
    () => direction,
    () => 'up',
  )
}
