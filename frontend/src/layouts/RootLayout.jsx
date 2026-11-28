import { MotionConfig } from 'motion/react'
import { Navigate, Outlet, useLocation } from 'react-router'
import ScrollToTop from '../components/layout/ScrollToTop.jsx'
import { Toaster } from '../components/ui'
import { transition } from '../lib/motion.js'

/**
 * Tabs live in `?onglet=` everywhere (Mon espace and the admin). Links saved before the
 * rename used `?tab=`: same value, other parameters kept, history entry replaced.
 */
function legacyTabSearch(search) {
  const params = new URLSearchParams(search)
  if (!params.has('tab')) return null
  if (!params.has('onglet')) params.set('onglet', params.get('tab'))
  params.delete('tab')
  const next = params.toString()
  return next ? `?${next}` : ''
}

/**
 * App root: Motion respects the user's reduced-motion setting (transforms off,
 * opacity fades kept), toasts, and scroll restoration on route change.
 */
export default function RootLayout() {
  const location = useLocation()
  const legacySearch = legacyTabSearch(location.search)

  if (legacySearch !== null) {
    return <Navigate to={{ ...location, search: legacySearch }} replace />
  }

  return (
    <MotionConfig reducedMotion="user" transition={transition.base}>
      <ScrollToTop />
      <Outlet />
      <Toaster />
    </MotionConfig>
  )
}
