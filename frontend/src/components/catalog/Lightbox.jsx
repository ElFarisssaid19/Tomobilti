import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { fadeIn, scaleIn, transition } from '../../lib/motion.js'
import { IconButton } from '../ui'
import PhotoCredit from './PhotoCredit.jsx'

/** Distance (px) or speed (px/s) of a horizontal swipe that changes the photo. */
const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 400

/**
 * Full-screen photo viewer: arrows (buttons and keyboard), Escape to close (Headless
 * UI Dialog, which also traps the focus), swipe left or right on touch screens.
 */
export default function Lightbox({ open, onClose, images, index, onIndexChange, title }) {
  const count = images.length
  const image = images[index]
  const go = (step) => onIndexChange((index + step + count) % count)

  // Arrows work wherever the focus is while the viewer is open.
  useEffect(() => {
    if (!open || count < 2) return undefined
    function handleKeyDown(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        onIndexChange((index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, count, index, onIndexChange])

  function handleDragEnd(_event, { offset, velocity }) {
    if (count < 2) return
    if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) go(1)
    else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) go(-1)
  }

  return (
    <AnimatePresence>
      {open && image && (
        <Dialog static open={open} onClose={onClose} className="relative z-(--z-overlay)">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            className="fixed inset-0 bg-canvas/95 backdrop-blur-sm"
          />
          <DialogPanel
            as={motion.div}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6">
              <DialogTitle className="min-w-0 truncate text-base font-semibold text-fg">
                {title}
                {count > 1 && (
                  <span className="ml-2 font-medium text-fg-muted tabular-nums">
                    {index + 1} / {count}
                  </span>
                )}
              </DialogTitle>
              <IconButton icon={X} label="Fermer" onClick={onClose} />
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.img
                  key={image.id}
                  src={image.url}
                  srcSet={`${image.thumbnail_url} 800w, ${image.url} 1600w`}
                  sizes="100vw"
                  alt={image.alt ?? title}
                  width={1600}
                  height={1000}
                  decoding="async"
                  drag={count > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: transition.base }}
                  exit={{ opacity: 0, transition: transition.fast }}
                  className="max-h-full w-auto max-w-full touch-pan-y rounded-card object-contain select-none"
                  draggable={false}
                />
              </AnimatePresence>
              {count > 1 && (
                <>
                  <IconButton
                    icon={ChevronLeft}
                    label="Photo précédente"
                    onClick={() => go(-1)}
                    className="absolute left-3 hidden sm:inline-flex"
                  />
                  <IconButton
                    icon={ChevronRight}
                    label="Photo suivante"
                    onClick={() => go(1)}
                    className="absolute right-3 hidden sm:inline-flex"
                  />
                </>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
              {count > 1 && (
                <div className="flex items-center gap-3 sm:hidden">
                  <IconButton icon={ChevronLeft} label="Photo précédente" onClick={() => go(-1)} />
                  <IconButton icon={ChevronRight} label="Photo suivante" onClick={() => go(1)} />
                </div>
              )}
              <PhotoCredit image={image} />
            </div>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
