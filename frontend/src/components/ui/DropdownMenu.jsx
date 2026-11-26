import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from '@headlessui/react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment } from 'react'
import { Link } from 'react-router'
import { cn } from '../../lib/cn.js'
import { scaleIn } from '../../lib/motion.js'

const ITEM =
  'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm font-medium text-fg-muted transition-colors data-disabled:cursor-not-allowed data-disabled:text-fg-disabled data-focus:bg-raised-hover data-focus:text-fg'

/**
 * Menu of actions (Headless UI Menu: arrow keys, typeahead, Escape).
 * `trigger` must be an element that forwards its ref (Button, IconButton, Avatar button).
 * `items`: `[{ label, icon, onClick?, to?, danger?, disabled? } | { divider: true }]`.
 *
 * @example
 * <DropdownMenu trigger={<IconButton icon={Ellipsis} label="Actions" />} items={[{ label: 'Modifier', icon: Pencil, onClick: edit }]} />
 */
export default function DropdownMenu({ trigger, items = [], align = 'end', header, className }) {
  return (
    <Menu>
      {({ open }) => (
        <>
          <MenuButton as={Fragment}>{trigger}</MenuButton>
          <AnimatePresence>
            {open && (
              <MenuItems
                static
                as={motion.div}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                anchor={{ to: `bottom ${align}`, gap: 8, padding: 16 }}
                className={cn(
                  'z-(--z-popover) min-w-56 rounded-input border border-line bg-raised p-1.5 shadow-pop focus-visible:outline-none',
                  align === 'end'
                    ? 'origin-top-right data-[anchor^=top]:origin-bottom-right'
                    : 'origin-top-left data-[anchor^=top]:origin-bottom-left',
                  className,
                )}
              >
                {header && <div className="border-b border-line px-3 pt-2 pb-3">{header}</div>}
                {items.map((item, index) => {
                  if (item.divider) {
                    return (
                      <MenuSeparator key={`divider-${index}`} className="my-1.5 h-px bg-line" />
                    )
                  }
                  const Icon = item.icon
                  const classes = cn(ITEM, item.danger && 'text-danger data-focus:text-danger')
                  const content = (
                    <>
                      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                      {item.label}
                    </>
                  )
                  return (
                    <MenuItem key={item.label} disabled={item.disabled}>
                      {item.to ? (
                        <Link to={item.to} className={classes}>
                          {content}
                        </Link>
                      ) : (
                        <button type="button" onClick={item.onClick} className={classes}>
                          {content}
                        </button>
                      )}
                    </MenuItem>
                  )
                })}
              </MenuItems>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  )
}
