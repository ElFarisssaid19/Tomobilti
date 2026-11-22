import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn.js'
import { transition } from '../../lib/motion.js'

/**
 * FAQ-style accordion (Headless UI Disclosure). The panel fades in (opacity and a
 * 4px rise only, no height animation, per the motion rules).
 * `items`: `[{ title, content, defaultOpen? }]`.
 *
 * @example <Accordion items={[{ title: 'Faut-il une caution ?', content: '…' }]} />
 */
export default function Accordion({ items = [], className }) {
  return (
    <div
      className={cn(
        'divide-y divide-line rounded-card-lg border border-line bg-surface',
        className,
      )}
    >
      {items.map((item) => (
        <Disclosure key={item.title} defaultOpen={item.defaultOpen}>
          {({ open }) => (
            <div>
              <DisclosureButton className="group flex w-full items-center justify-between gap-4 rounded-card-lg px-5 py-5 text-left text-base font-semibold text-fg transition-colors data-hover:text-white sm:px-6">
                {item.title}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-raised transition-[background-color,border-color] duration-150 group-data-open:border-lime group-data-open:bg-lime">
                  <Plus
                    className="size-4 text-fg transition-transform duration-250 ease-out group-data-open:rotate-45 group-data-open:text-on-lime motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </span>
              </DisclosureButton>
              <AnimatePresence initial={false}>
                {open && (
                  <DisclosurePanel
                    static
                    as={motion.div}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: transition.base }}
                    exit={{ opacity: 0, transition: { duration: 0 } }}
                    className="px-5 pb-5 text-base leading-relaxed text-fg-muted sm:px-6"
                  >
                    {item.content}
                  </DisclosurePanel>
                )}
              </AnimatePresence>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  )
}
