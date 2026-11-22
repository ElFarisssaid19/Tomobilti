import { Description, Field, Switch as HeadlessSwitch, Label } from '@headlessui/react'
import { cn } from '../../lib/cn.js'

/**
 * On/off switch with a label (and optional hint) on the left.
 * @example <Switch label="Voiture à la une" checked={featured} onChange={setFeatured} />
 */
export default function Switch({
  label,
  hint,
  name,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  className,
  ...props
}) {
  return (
    <Field disabled={disabled} className={cn('flex items-center justify-between gap-4', className)}>
      {(label || hint) && (
        <span className="flex flex-col gap-1">
          {label && (
            <Label className="text-sm font-medium text-fg data-disabled:text-fg-disabled">
              {label}
            </Label>
          )}
          {hint && (
            <Description className="text-sm text-fg-subtle data-disabled:text-fg-disabled">
              {hint}
            </Description>
          )}
        </span>
      )}
      <HeadlessSwitch
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="group relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line-control bg-raised transition-[background-color,border-color] duration-150 data-checked:border-lime data-checked:bg-lime data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-canvas data-hover:border-fg-subtle"
        {...props}
      >
        <span
          aria-hidden="true"
          className="size-5 translate-x-1 rounded-full bg-fg-muted transition-[translate,background-color] duration-250 ease-out group-data-checked:translate-x-6 group-data-checked:bg-on-lime group-data-disabled:bg-fg-disabled motion-reduce:transition-none"
        />
      </HeadlessSwitch>
    </Field>
  )
}
