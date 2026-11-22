import { Check } from 'lucide-react'
import { LayoutGroup, motion } from 'motion/react'
import { createContext, useCallback, useContext, useId, useMemo, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { spring } from '../../lib/motion.js'

const ChipGroupContext = createContext(null)

/**
 * Filter chip (toggle button). Use it alone with `selected`/`onClick`, or inside a
 * <ChipGroup> which manages the selection.
 */
export function Chip({
  value,
  selected,
  onClick,
  icon: Icon,
  count,
  disabled = false,
  className,
  children,
  ...props
}) {
  const group = useContext(ChipGroupContext)
  const isSelected = group ? group.isSelected(value) : Boolean(selected)
  const slides = group && !group.multiple

  function handleClick(event) {
    onClick?.(event)
    group?.toggle(value)
  }

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative isolate inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[color,background-color,border-color] duration-150 ease-out motion-safe:active:scale-[0.98]',
        isSelected
          ? 'border-transparent text-on-lime'
          : 'border-line bg-raised text-fg-muted hover:border-line-strong hover:bg-raised-hover hover:text-fg',
        disabled && 'pointer-events-none border-line bg-raised text-fg-disabled',
        className,
      )}
      {...props}
    >
      {isSelected &&
        (slides ? (
          <motion.span
            layoutId="chip-indicator"
            transition={spring}
            className="absolute inset-0 -z-10 rounded-full bg-lime"
            aria-hidden="true"
          />
        ) : (
          <span className="absolute inset-0 -z-10 rounded-full bg-lime" aria-hidden="true" />
        ))}
      {group?.multiple && isSelected ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4" aria-hidden="true" />
      )}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'tabular-nums',
            isSelected ? 'text-on-lime/70' : 'text-fg-subtle',
            disabled && 'text-fg-disabled',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Row of filter chips, single select (default) or multi select.
 * In single mode the lime indicator slides between chips (shared layout animation).
 * The row scrolls horizontally on small screens; `bleed` lets it run to the screen
 * edges inside a page container.
 *
 * @example
 * <ChipGroup label="Catégorie" value={category} onChange={setCategory}>
 *   <Chip value="all">Toutes</Chip>
 *   <Chip value="suv">SUV</Chip>
 * </ChipGroup>
 */
export function ChipGroup({
  label,
  value,
  defaultValue,
  onChange,
  multiple = false,
  bleed = false,
  wrap = false,
  className,
  children,
}) {
  const [internal, setInternal] = useState(defaultValue ?? (multiple ? [] : null))
  const selection = value !== undefined ? value : internal
  const groupId = useId()

  const toggle = useCallback(
    (chipValue) => {
      let next
      if (multiple) {
        const current = Array.isArray(selection) ? selection : []
        next = current.includes(chipValue)
          ? current.filter((item) => item !== chipValue)
          : [...current, chipValue]
      } else {
        next = chipValue
      }
      if (value === undefined) setInternal(next)
      onChange?.(next)
    },
    [multiple, onChange, selection, value],
  )

  const context = useMemo(
    () => ({
      multiple,
      toggle,
      isSelected: (chipValue) =>
        multiple
          ? Array.isArray(selection) && selection.includes(chipValue)
          : selection === chipValue,
    }),
    [multiple, selection, toggle],
  )

  return (
    <ChipGroupContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        <div
          role="group"
          aria-label={label}
          className={cn(
            // Vertical padding keeps focus rings visible inside the scroll container.
            'flex max-w-full gap-2 py-1',
            wrap ? 'flex-wrap' : 'scrollbar-none overflow-x-auto overscroll-x-contain',
            bleed && !wrap && '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0',
            className,
          )}
        >
          {children}
        </div>
      </LayoutGroup>
    </ChipGroupContext.Provider>
  )
}
