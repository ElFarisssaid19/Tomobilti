import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { pageTransition } from '../../lib/motion.js'

/**
 * Keeps the outlet of the leaving route frozen while it animates out, otherwise the
 * new page would render inside the exiting wrapper.
 */
function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
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
