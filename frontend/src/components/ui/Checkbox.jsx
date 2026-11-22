import { Checkbox as HeadlessCheckbox, Description, Field, Label } from '@headlessui/react'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { getFieldError, toErrorMessage } from '../../lib/validation.js'
import { FieldError } from './FormField.jsx'

/**
 * Checkbox with its label on the right, an optional hint and error.
 * @example <Checkbox label="J’accepte les conditions de location" checked={ok} onChange={setOk} />
 */
export default function Checkbox({
  label,
  hint,
  error,
  errors,
  name,
  checked,
  defaultChecked,
  onChange,
  indeterminate = false,
  disabled = false,
  className,
  ...props
}) {
  const message = toErrorMessage(error) ?? getFieldError(errors, name)

  return (
    <Field disabled={disabled} className={cn('flex items-start gap-3', className)}>
      <HeadlessCheckbox
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        indeterminate={indeterminate}
        aria-invalid={message ? true : undefined}
        className={cn(
          'group mt-0.5 grid size-5 shrink-0 place-items-center rounded-xs border border-line-control bg-surface transition-[background-color,border-color] duration-150 data-checked:border-lime data-checked:bg-lime data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-raised data-hover:border-fg-subtle data-indeterminate:border-lime data-indeterminate:bg-lime',
          message && 'border-danger',
        )}
        {...props}
      >
        <Check
          className="hidden size-3.5 text-on-lime group-data-checked:block group-data-indeterminate:hidden"
          strokeWidth={3}
          aria-hidden="true"
        />
        <Minus
          className="hidden size-3.5 text-on-lime group-data-indeterminate:block"
          strokeWidth={3}
          aria-hidden="true"
        />
      </HeadlessCheckbox>
      {(label || hint || message) && (
        <div className="flex flex-col gap-1">
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
          {message && <FieldError>{message}</FieldError>}
        </div>
      )}
    </Field>
  )
}
