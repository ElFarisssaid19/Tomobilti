import { Description, Field, Label } from '@headlessui/react'
import { CircleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { getFieldError, toErrorMessage } from '../../lib/validation.js'
import { FieldContext } from './fieldContext.js'

/**
 * Label + control + hint + error. Headless UI's <Field> links the label, the hint and
 * the error to the control (id, aria-describedby, aria-invalid) automatically.
 *
 * The error comes from `error` (string or string[]) or from a Laravel 422 payload:
 * pass `errors` (the axios error, `{ message, errors }` or the `errors` object) and
 * `name`, and the first message for that field is shown.
 *
 * @example
 * <FormField label="Adresse e-mail" name="email" errors={apiError}>
 *   <Input type="email" name="email" />
 * </FormField>
 */
export default function FormField({
  label,
  hint,
  error,
  errors,
  name,
  required = false,
  disabled = false,
  className,
  labelClassName,
  children,
}) {
  const message = toErrorMessage(error) ?? getFieldError(errors, name)

  return (
    <Field disabled={disabled} className={cn('flex flex-col gap-2', className)}>
      {label && (
        <Label
          className={cn(
            'text-sm font-semibold text-fg data-disabled:text-fg-disabled',
            labelClassName,
          )}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-fg-subtle" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}
      <FieldContext.Provider value={{ invalid: Boolean(message), name }}>
        {children}
      </FieldContext.Provider>
      {hint && (
        <Description className="text-sm text-fg-subtle data-disabled:text-fg-disabled">
          {hint}
        </Description>
      )}
      {message && <FieldError>{message}</FieldError>}
    </Field>
  )
}

/** Error line linked to the control by Headless UI (aria-describedby). */
export function FieldError({ children, className }) {
  return (
    <Description
      as="p"
      className={cn('flex items-start gap-1.5 text-sm font-medium text-danger', className)}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </Description>
  )
}
