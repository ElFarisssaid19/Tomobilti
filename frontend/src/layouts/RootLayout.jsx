import { MotionConfig } from 'motion/react'
import { Outlet } from 'react-router'
import ScrollToTop from '../components/layout/ScrollToTop.jsx'
import { Toaster } from '../components/ui'
import { transition } from '../lib/motion.js'

/**
 * App root: Motion respects the user's reduced-motion setting (transforms off,
 * opacity fades kept), toasts, and scroll restoration on route change.
 */
export default function RootLayout() {
  return (
    <MotionConfig reducedMotion="user" transition={transition.base}>
      <ScrollToTop />
      <Outlet />
      <Toaster />
    </MotionConfig>
  )
}
