import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/cn.js'
import { scaleIn } from '../../lib/motion.js'
import { CONTROL_CLASSES, useControlState } from './fieldContext.js'
import FormField from './FormField.jsx'

/**
 * Select built on Headless UI's Listbox (keyboard navigation, typeahead, ARIA).
 * `options` is a `[{ value, label, disabled? }]` list, e.g. `toOptions(FUEL_TYPE)`.
 *
 * `hideLabel` keeps the label for screen readers only (e.g. the Select that replaces Tabs).
 *
 * @example
 * <Select label="Carburant" name="fuel" options={toOptions(FUEL_TYPE)} value={fuel} onChange={setFuel} />
 */
export default function Select({
  label,
  hint,
  info,
  error,
  errors,
  name,
  required,
  disabled,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Choisir…',
  hideLabel = false,
  className,
  ...props
}) {
  const { needsField, invalid } = useControlState({ label, hint, info, error, errors, name })

  const control = (
    <Listbox
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      name={name}
      disabled={disabled}
      invalid={invalid}
      {...props}
    >
      {({ open, value: current }) => {
        const selected = options.find((option) => option.value === current)
        return (
          <div className={cn('relative', !needsField && className)}>
            <ListboxButton
              className={cn(
                CONTROL_CLASSES,
                'group flex h-12 items-center justify-between gap-3 px-4 text-left',
              )}
            >
              <span className={cn('truncate', !selected && 'text-fg-subtle')}>
                {selected?.label ?? placeholder}
              </span>
              <ChevronDown
                className="size-[1.125rem] shrink-0 text-fg-subtle transition-transform duration-150 group-data-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </ListboxButton>
            <AnimatePresence>
              {open && (
                <ListboxOptions
                  static
                  as={motion.div}
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  anchor={{ to: 'bottom start', gap: 8, padding: 16 }}
                  className="z-(--z-popover) max-h-72 w-(--button-width) min-w-48 origin-top overflow-y-auto rounded-input border border-line bg-raised p-1.5 shadow-pop focus-visible:outline-none data-[anchor^=top]:origin-bottom"
                >
                  {options.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="group flex cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-sm text-fg-muted select-none data-disabled:cursor-not-allowed data-disabled:text-fg-disabled data-focus:bg-raised-hover data-focus:text-fg data-selected:font-semibold data-selected:text-fg"
                    >
                      <span className="truncate">{option.label}</span>
                      <Check
                        className="invisible size-4 text-accent-text group-data-selected:visible"
                        aria-hidden="true"
                      />
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              )}
            </AnimatePresence>
          </div>
        )
      }}
    </Listbox>
  )

  if (!needsField) return control

  return (
    <FormField
      label={label}
      hint={hint}
      info={info}
      hideLabel={hideLabel}
      error={error}
      errors={errors}
      name={name}
      required={required}
      disabled={disabled}
      className={className}
    >
      {control}
    </FormField>
  )
}
