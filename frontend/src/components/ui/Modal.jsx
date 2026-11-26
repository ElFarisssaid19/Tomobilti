import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import useScrollEdges from '../../hooks/useScrollEdges.js'
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
 * It always fits the viewport (`max-h-overlay`): the header (title, close button) and
 * the footer (actions) stay visible and only the body scrolls. A divider appears under
 * the header or above the footer while there is hidden content on that side.
 * Below `sm` it sits at the bottom of the screen like a sheet, above the safe area.
 *
 * Pass `onSubmit` for a form dialog: the body and the footer are wrapped in one
 * `<form>`, so a `type="submit"` button in `footer` submits it.
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
  onSubmit,
  className,
  bodyClassName,
  children,
}) {
  const [bodyRef, edges] = useScrollEdges('y')
  const hasBody = Boolean(description || children)

  const content = (
    <>
      {hasBody && (
        <div
          ref={bodyRef}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-1 sm:px-7',
            footer ? 'pb-2' : 'pb-6 sm:pb-7',
            bodyClassName,
          )}
        >
          {description && (
            <Description className="text-base text-fg-muted">{description}</Description>
          )}
          {children && <div className={cn(description && 'mt-5')}>{children}</div>}
        </div>
      )}
      {footer && (
        <div
          className={cn(
            'flex shrink-0 flex-col-reverse gap-2 border-t px-6 pt-4 pb-6 transition-colors duration-150 sm:flex-row sm:justify-end sm:px-7 sm:pb-7',
            edges.end ? 'border-line' : 'border-transparent',
          )}
        >
          {footer}
        </div>
      )}
    </>
  )

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
          <div className="fixed inset-0 flex items-end justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6">
            <DialogPanel
              as={motion.div}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'flex max-h-overlay w-full flex-col rounded-card-lg border border-line bg-surface shadow-pop',
                SIZES[size],
                className,
              )}
            >
              <div
                className={cn(
                  'flex shrink-0 items-start justify-between gap-4 border-b px-6 pt-6 transition-colors duration-150 sm:px-7 sm:pt-7',
                  hasBody ? 'pb-3' : 'pb-1',
                  edges.start ? 'border-line' : 'border-transparent',
                )}
              >
                <DialogTitle className="text-xl font-bold text-fg">{title}</DialogTitle>
                {!hideClose && (
                  <IconButton
                    icon={X}
                    label="Fermer"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="-mt-1 -mr-2 shrink-0"
                  />
                )}
              </div>
              {onSubmit ? (
                <form onSubmit={onSubmit} noValidate className="contents">
                  {content}
                </form>
              ) : (
                content
              )}
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
