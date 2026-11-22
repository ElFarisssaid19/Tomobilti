import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn.js'
import { ease, fadeIn } from '../../lib/motion.js'
import IconButton from './IconButton.jsx'

const SLIDE = {
  right: { x: '100%' },
  left: { x: '-100%' },
  bottom: { y: '100%' },
}

const PANEL = {
  right: 'inset-y-0 right-0 h-full w-[min(24rem,calc(100vw-2rem))] rounded-l-card-lg border-l',
  left: 'inset-y-0 left-0 h-full w-[min(20rem,calc(100vw-2rem))] rounded-r-card-lg border-r',
  bottom: 'inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-card-lg border-t',
}

/**
 * Side drawer or bottom sheet (`side="bottom"`, for mobile filters), sliding in over a
 * backdrop. Built on Headless UI Dialog (focus trap, Escape, scroll lock).
 *
 * @example
 * <Drawer open={open} onClose={close} side="bottom" title="Filtres" footer={<Button>Voir 24 voitures</Button>}>…</Drawer>
 */
export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  footer,
  className,
  children,
}) {
  const transition = { duration: 0.35, ease: ease.out }

  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={onClose} className="relative z-(--z-overlay)">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            className="fixed inset-0 bg-canvas/75 backdrop-blur-sm"
          />
          <DialogPanel
            as={motion.div}
            initial={{ ...SLIDE[side], opacity: 0.6 }}
            animate={{ x: 0, y: 0, opacity: 1, transition }}
            exit={{ ...SLIDE[side], opacity: 0.6, transition: { duration: 0.25, ease: ease.out } }}
            className={cn(
              'fixed flex flex-col border-line bg-surface shadow-pop',
              PANEL[side],
              className,
            )}
          >
            {side === 'bottom' && (
              <div
                aria-hidden="true"
                className="mx-auto mt-3 h-1 w-10 rounded-full bg-line-strong"
              />
            )}
            <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-2 sm:px-6">
              <DialogTitle className="text-lg font-bold text-fg">{title}</DialogTitle>
              <IconButton
                icon={X}
                label="Fermer"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="-mr-2"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6">{children}</div>
            {footer && (
              <div className="border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                {footer}
              </div>
            )}
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

/** Bottom sheet shortcut: `<BottomSheet>` = `<Drawer side="bottom">`. */
export function BottomSheet(props) {
  return <Drawer {...props} side="bottom" />
}
