import { useSyncExternalStore } from 'react'

/** True once the window is scrolled past `threshold` pixels (navbar background). */
export default function useScrolled(threshold = 12) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true })
      return () => window.removeEventListener('scroll', onChange)
    },
    () => window.scrollY > threshold,
    () => false,
  )
}
