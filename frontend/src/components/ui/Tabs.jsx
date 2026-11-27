import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import useScrollEdges from '../../hooks/useScrollEdges.js'
import { cn } from '../../lib/cn.js'
import { fadeIn, spring } from '../../lib/motion.js'
import Select from './Select.jsx'

/** Width of the edge fades: a tab scrolled into view clears it. */
const FADE = 40

/**
 * Tabs (Headless UI: arrow keys, roving focus, ARIA). The lime indicator slides to
 * the selected tab (shared layout animation).
 * `tabs`: `[{ label, content, icon?, count?, disabled? }]`.
 *
 * Narrow screens: the row scrolls sideways, a fade marks each edge that hides tabs,
 * and the selected tab is always scrolled fully into view (on load and on change).
 * On a phone (below `sm`), when the tabs do not fit, a Select replaces the row
 * (`collapse={false}` keeps the row).
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
  collapse = true,
  className,
  panelClassName,
}) {
  const id = useId()
  const reduceMotion = useReducedMotion()
  const isPhone = useMediaQuery('(max-width: 639.98px)')
  const [internalIndex, setInternalIndex] = useState(defaultIndex ?? 0)
  const current = selectedIndex ?? internalIndex
  const [listRef, edges, list] = useScrollEdges('x')
  const wrapperRef = useRef(null)
  const [overflows, setOverflows] = useState(false)
  const scrolledOnce = useRef(false)
  const collapsed = collapse && isPhone && overflows

  function select(index) {
    setInternalIndex(index)
    onChange?.(index)
  }

  // Do the tabs fit? The list scrolls sideways, so its scrollWidth is the natural width
  // of the tabs, even while it is hidden (and kept inside the wrapper) behind the Select.
  // The answer therefore does not flip once the Select shows.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || !list) return undefined
    const measure = () => setOverflows(list.scrollWidth > wrapper.clientWidth + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    observer.observe(list)
    return () => observer.disconnect()
  }, [list])

  // Keep the selected tab fully visible, clear of the edge fades.
  useEffect(() => {
    if (!list || collapsed) return
    const tab = list.querySelectorAll('[role="tab"]')[current]
    if (!tab) return
    const start = tab.offsetLeft - FADE
    const end = tab.offsetLeft + tab.offsetWidth + FADE - list.clientWidth
    let target = list.scrollLeft
    if (list.scrollLeft > start) target = start
    else if (list.scrollLeft < end) target = end
    target = Math.max(0, target)
    if (Math.abs(target - list.scrollLeft) > 1) {
      list.scrollTo({
        left: target,
        behavior: scrolledOnce.current && !reduceMotion ? 'smooth' : 'auto',
      })
    }
    scrolledOnce.current = true
  }, [current, list, collapsed, reduceMotion])

  const fade =
    'pointer-events-none absolute inset-y-px w-10 transition-opacity duration-150 motion-reduce:transition-none'

  return (
    <TabGroup selectedIndex={current} onChange={select} className={className}>
      <div ref={wrapperRef} className="relative">
        {collapsed && (
          <Select
            label={label ?? 'Onglet'}
            hideLabel
            value={current}
            onChange={select}
            options={tabs.map((tab, index) => ({
              value: index,
              label: tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label,
              disabled: tab.disabled,
            }))}
          />
        )}
        <div
          className={cn(
            'relative max-w-full',
            fullWidth ? 'flex' : 'inline-flex',
            // Hidden but measured while the Select replaces it.
            collapsed && 'invisible absolute inset-x-0 top-0',
          )}
          aria-hidden={collapsed || undefined}
        >
          <LayoutGroup id={id}>
            <TabList
              ref={listRef}
              aria-label={label}
              className={cn(
                'relative scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-line bg-surface p-1',
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
                      'relative isolate inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-fg-muted transition-colors duration-150 data-disabled:cursor-not-allowed data-disabled:text-fg-disabled not-data-selected:data-hover:text-fg data-selected:text-on-lime md:h-9',
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
          <span
            aria-hidden="true"
            data-testid="tabs-fade-start"
            data-visible={edges.start || undefined}
            className={cn(
              fade,
              'left-px rounded-l-full bg-linear-to-r from-surface to-transparent',
              edges.start ? 'opacity-100' : 'opacity-0',
            )}
          />
          <span
            aria-hidden="true"
            data-testid="tabs-fade-end"
            data-visible={edges.end || undefined}
            className={cn(
              fade,
              'right-px rounded-r-full bg-linear-to-l from-surface to-transparent',
              edges.end ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
      </div>
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
