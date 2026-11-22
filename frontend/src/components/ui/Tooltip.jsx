import { AnimatePresence, motion } from 'motion/react'
import { cloneElement, isValidElement, useId, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { transition } from '../../lib/motion.js'

const POSITION = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  right: 'top-1/2 left-full ml-3 -translate-y-1/2',
  left: 'top-1/2 right-full mr-3 -translate-y-1/2',
}

const OFFSET = {
  top: { y: 4 },
  bottom: { y: -4 },
  right: { x: -4 },
  left: { x: 4 },
}

/**
 * Short hint on hover and keyboard focus (Escape closes it). Supplementary only:
 * the trigger must already have an accessible name (e.g. IconButton `label`).
 *
 * @example <Tooltip content="Ajouter aux favoris"><IconButton icon={Heart} label="Ajouter aux favoris" /></Tooltip>
 */
export default function Tooltip({ content, side = 'top', disabled = false, className, children }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const visible = open && !disabled

  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': visible ? id : undefined })
    : children

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      {trigger}
      <AnimatePresence>
        {visible && (
          <motion.span
            role="tooltip"
            id={id}
            initial={{ opacity: 0, ...OFFSET[side] }}
            animate={{ opacity: 1, x: 0, y: 0, transition: transition.fast }}
            exit={{ opacity: 0, transition: transition.fast }}
            className={cn(
              'pointer-events-none absolute z-(--z-popover) rounded-sm border border-line-strong bg-raised px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-fg shadow-pop',
              POSITION[side],
              className,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
