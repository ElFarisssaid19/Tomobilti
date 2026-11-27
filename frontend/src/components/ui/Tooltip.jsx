import { Portal } from '@headlessui/react'
import { Info } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../../lib/cn.js'
import { transition } from '../../lib/motion.js'
import { placeTooltip } from '../../lib/placement.js'

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
 * The tooltip is portaled (never clipped by a scroll container or a card), uses fixed
 * coordinates, flips to the other side when there is no room and stays inside the
 * viewport. Long text wraps (max 18rem). `openOnClick` also opens it on click or tap, for
 * touch screens (used by `InfoTip`); a tap elsewhere, Escape or blur closes it.
 *
 * @example <Tooltip content="Ajouter aux favoris"><IconButton icon={Heart} label="Ajouter aux favoris" /></Tooltip>
 */
export default function Tooltip({
  content,
  side = 'top',
  disabled = false,
  openOnClick = false,
  className,
  children,
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const anchorRef = useRef(null)
  // State, not a ref: Headless UI's Portal mounts its children one render later outside
  // a Dialog, so the tooltip is measured when its element really exists.
  const [tip, setTip] = useState(null)
  const id = useId()
  const visible = open && !disabled

  const place = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor || !tip) return
    setPosition(
      placeTooltip(
        anchor.getBoundingClientRect(),
        { width: tip.offsetWidth, height: tip.offsetHeight },
        side,
        { width: window.innerWidth, height: window.innerHeight },
      ),
    )
  }, [side, tip])

  useLayoutEffect(() => {
    if (!visible) return undefined
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
      setPosition(null)
    }
  }, [visible, place, content])

  // A tap elsewhere closes a tooltip opened by a tap (iOS does not move the focus).
  useEffect(() => {
    if (!visible || !openOnClick) return undefined
    function handlePointerDown(event) {
      if (!anchorRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [visible, openOnClick])

  const trigger = isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': visible ? id : undefined })
    : children

  const finalSide = position?.side ?? side

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex"
      onPointerEnter={(event) => event.pointerType !== 'touch' && setOpen(true)}
      onPointerLeave={(event) => event.pointerType !== 'touch' && setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={openOnClick ? () => setOpen(true) : undefined}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      {trigger}
      <AnimatePresence>
        {visible && (
          <Portal>
            <motion.span
              ref={setTip}
              role="tooltip"
              id={id}
              initial={{ opacity: 0, ...OFFSET[finalSide] }}
              animate={{ opacity: 1, x: 0, y: 0, transition: transition.fast }}
              exit={{ opacity: 0, transition: transition.fast }}
              style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                visibility: position ? 'visible' : 'hidden',
              }}
              className={cn(
                'pointer-events-none fixed z-(--z-popover) w-max max-w-[min(18rem,calc(100vw-1rem))] rounded-sm border border-line-strong bg-raised px-2.5 py-1.5 text-xs font-semibold text-fg shadow-pop',
                className,
              )}
            >
              {content}
            </motion.span>
          </Portal>
        )}
      </AnimatePresence>
    </span>
  )
}

/**
 * Small "i" button that shows an explanation (a rule or a consequence) in a tooltip, on
 * hover, focus or tap. Put it next to the label of the field or switch it explains,
 * instead of a paragraph on the page. `label` names it for screen readers.
 *
 * @example <InfoTip label="À propos de l’agence active" content="Une agence désactivée disparaît de la réservation en ligne." />
 */
export function InfoTip({ content, label = 'Plus d’informations', side = 'top', className }) {
  return (
    <Tooltip content={content} side={side} openOnClick>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'touch-target relative inline-grid size-6 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors duration-150 hover:bg-raised hover:text-fg',
          className,
        )}
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
    </Tooltip>
  )
}
