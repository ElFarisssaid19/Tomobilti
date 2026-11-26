import { Input as HeadlessInput, Textarea as HeadlessTextarea } from '@headlessui/react'
import { cn } from '../../lib/cn.js'
import { CONTROL_CLASSES, useControlState } from './fieldContext.js'
import FormField from './FormField.jsx'

/**
 * Text input. Pass `label`, `hint`, `error` or `errors` + `name` and it renders its
 * own <FormField>; inside a <FormField> it renders the bare control.
 *
 * @example <Input label="Téléphone" name="phone" type="tel" placeholder="+212 6 12 34 56 78" />
 * @example <Input leftIcon={Search} aria-label="Rechercher" placeholder="Marque, modèle…" />
 * @example <Input type="password" trailing={<IconButton … />} />  // interactive element on the right
 */
export function Input({
  label,
  hint,
  info,
  error,
  errors,
  name,
  required,
  disabled,
  leftIcon: Icon,
  suffix,
  trailing,
  className,
  inputClassName,
  ...props
}) {
  const { needsField, invalid } = useControlState({ label, hint, info, error, errors, name })

  const control = (
    <div className={cn('relative', !needsField && className)}>
      {Icon && (
        <Icon
          className="pointer-events-none absolute top-1/2 left-4 size-[1.125rem] -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
      )}
      <HeadlessInput
        name={name}
        required={required}
        disabled={disabled}
        invalid={invalid}
        className={cn(
          CONTROL_CLASSES,
          'h-12 px-4',
          Icon && 'pl-11',
          suffix && 'pr-14',
          trailing && 'pr-13',
          inputClassName,
        )}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-fg-subtle">
          {suffix}
        </span>
      )}
      {trailing && (
        <span className="absolute top-1/2 right-1.5 flex -translate-y-1/2">{trailing}</span>
      )}
    </div>
  )

  if (!needsField) return control

  return (
    <FormField
      label={label}
      hint={hint}
      info={info}
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

/** Multi-line text input, same API as <Input>. */
export function Textarea({
  label,
  hint,
  info,
  error,
  errors,
  name,
  required,
  disabled,
  rows = 4,
  className,
  inputClassName,
  ...props
}) {
  const { needsField, invalid } = useControlState({ label, hint, info, error, errors, name })

  const control = (
    <HeadlessTextarea
      name={name}
      rows={rows}
      required={required}
      disabled={disabled}
      invalid={invalid}
      className={cn(
        CONTROL_CLASSES,
        'min-h-28 resize-y px-4 py-3 leading-relaxed',
        !needsField && className,
        inputClassName,
      )}
      {...props}
    />
  )

  if (!needsField) return control

  return (
    <FormField
      label={label}
      hint={hint}
      info={info}
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
