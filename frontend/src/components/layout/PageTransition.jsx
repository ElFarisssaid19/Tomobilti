import { AnimatePresence, motion, useIsPresent } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { pageTransition } from '../../lib/motion.js'

/**
 * Keeps the outlet of the leaving route frozen while it animates out, otherwise the
 * new page would render inside the exiting wrapper. While the page is present, the
 * live outlet is rendered, so nested routes under the same key (e.g. /espace/… with
 * its own tabs and detail pages) still update.
 */
function FrozenOutlet() {
  const outlet = useOutlet()
  const isPresent = useIsPresent()
  const lastPresentOutlet = useRef(outlet)

  useEffect(() => {
    if (isPresent) lastPresentOutlet.current = outlet
  })

  // The ref is only read once the page is leaving, to keep showing what it showed last.
  // eslint-disable-next-line react-hooks/refs
  return isPresent ? outlet : lastPresentOutlet.current
}

/**
 * Route outlet with a page transition: fade + 8px slide (AnimatePresence mode="wait").
 * `transitionKey` lets nested layouts animate only their own part (default: pathname).
 */
export default function PageTransition({ transitionKey, className }) {
  const location = useLocation()
  const key = transitionKey ?? location.pathname

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        <FrozenOutlet />
      </motion.div>
    </AnimatePresence>
  )
}
