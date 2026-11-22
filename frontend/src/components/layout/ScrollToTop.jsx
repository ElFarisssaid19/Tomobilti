import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router'

/** Scroll back to the top on every route change (not on hash or query changes). */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
