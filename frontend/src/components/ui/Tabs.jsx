import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { LayoutGroup, motion } from 'motion/react'
import { useId } from 'react'
import { cn } from '../../lib/cn.js'
import { fadeIn, spring } from '../../lib/motion.js'

/**
 * Tabs (Headless UI: arrow keys, roving focus, ARIA). The lime indicator slides to
 * the selected tab (shared layout animation).
 * `tabs`: `[{ label, content, icon?, count?, disabled? }]`.
 *
 * @example <Tabs tabs={[{ label: 'À venir', content: <Upcoming /> }, { label: 'Passées', content: <Past /> }]} />
 */
export default function Tabs({
  tabs = [],
  defaultIndex,
  selectedIndex,
  onChange,
  label,
  fullWidth = false,
  className,
  panelClassName,
}) {
  const id = useId()

  return (
    <TabGroup
      defaultIndex={defaultIndex}
      selectedIndex={selectedIndex}
      onChange={onChange}
      className={className}
    >
      <LayoutGroup id={id}>
        <TabList
          aria-label={label}
          className={cn(
            'scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1',
            fullWidth && 'flex w-full',
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Tab
                key={tab.label}
                disabled={tab.disabled}
                className={cn(
                  'relative isolate inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-fg-muted transition-colors duration-150 data-disabled:cursor-not-allowed data-disabled:text-fg-disabled not-data-selected:data-hover:text-fg data-selected:text-on-lime',
                  fullWidth && 'flex-1',
                )}
              >
                {({ selected }) => (
                  <>
                    {selected && (
                      <motion.span
                        layoutId="tab-indicator"
                        transition={spring}
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 rounded-full bg-lime"
                      />
                    )}
                    {Icon && <Icon className="size-4" aria-hidden="true" />}
                    {tab.label}
                    {tab.count !== undefined && (
                      <span
                        className={cn(
                          'tabular-nums',
                          selected ? 'text-on-lime/70' : 'text-fg-subtle',
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </>
                )}
              </Tab>
            )
          })}
        </TabList>
      </LayoutGroup>
      <TabPanels className={cn('mt-6', panelClassName)}>
        {tabs.map((tab) => (
          <TabPanel key={tab.label} className="rounded-card focus-visible:outline-offset-4">
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              {tab.content}
            </motion.div>
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
