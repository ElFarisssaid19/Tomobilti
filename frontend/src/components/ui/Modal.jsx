import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn.js'
import { fadeIn, scaleIn } from '../../lib/motion.js'
import IconButton from './IconButton.jsx'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * Animated dialog (Headless UI Dialog: focus trap, Escape, scroll lock, aria-modal).
 * Uses the documented `static` + AnimatePresence pattern so the exit animation runs.
 *
 * @example
 * <Modal open={open} onClose={() => setOpen(false)} title="Modifier la réservation" footer={…}>
 *   …
 * </Modal>
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  hideClose = false,
  initialFocus,
  className,
  children,
}) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog
          static
          open={open}
          onClose={onClose}
          initialFocus={initialFocus}
          className="relative z-(--z-overlay)"
        >
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            className="fixed inset-0 bg-canvas/75 backdrop-blur-sm"
          />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
              <DialogPanel
                as={motion.div}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  'w-full rounded-card-lg border border-line bg-surface p-6 shadow-pop sm:p-7',
                  SIZES[size],
                  className,
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-xl font-bold text-fg">{title}</DialogTitle>
                  {!hideClose && (
                    <IconButton
                      icon={X}
                      label="Fermer"
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="-mt-1 -mr-2"
                    />
                  )}
                </div>
                {description && (
                  <Description className="mt-2 text-base text-fg-muted">{description}</Description>
                )}
                {children && <div className="mt-5">{children}</div>}
                {footer && (
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {footer}
                  </div>
                )}
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
