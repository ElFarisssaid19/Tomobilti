import { useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query.
 * @example const isDesktop = useMediaQuery('(min-width: 768px)')
 */
export default function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
