import {
  Description,
  Field,
  Fieldset,
  RadioGroup as HeadlessRadioGroup,
  Label,
  Legend,
  Radio,
} from '@headlessui/react'
import { cn } from '../../lib/cn.js'
import { getFieldError, toErrorMessage } from '../../lib/validation.js'
import { FieldError } from './FormField.jsx'

/**
 * Group of radio cards. `options`: `[{ value, label, description?, disabled? }]`.
 * @example
 * <RadioGroup label="Lieu de retrait" name="pickup" options={locations} value={id} onChange={setId} />
 */
export default function RadioGroup({
  label,
  hint,
  error,
  errors,
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  disabled = false,
  columns = 1,
  className,
}) {
  const message = toErrorMessage(error) ?? getFieldError(errors, name)

  return (
    <Fieldset disabled={disabled} className={cn('flex flex-col gap-3', className)}>
      {label && (
        <Legend className="text-sm font-semibold text-fg data-disabled:text-fg-disabled">
          {label}
        </Legend>
      )}
      {hint && <p className="-mt-1 text-sm text-fg-subtle">{hint}</p>}
      <HeadlessRadioGroup
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-invalid={message ? true : undefined}
        className={cn(
          'grid gap-3',
          columns === 2 && 'sm:grid-cols-2',
          columns === 3 && 'sm:grid-cols-3',
        )}
      >
        {options.map((option) => (
          <Field key={option.value} disabled={option.disabled}>
            <Radio
              value={option.value}
              className={cn(
                'group flex h-full cursor-pointer items-start gap-3 rounded-card border border-line bg-surface p-4 transition-[border-color,background-color,box-shadow] duration-150 data-checked:border-lime data-checked:bg-lime/6 data-checked:shadow-glow-lime data-disabled:cursor-not-allowed data-disabled:bg-canvas data-hover:border-line-strong',
                message && 'border-danger',
              )}
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line-control transition-colors group-data-checked:border-lime group-data-disabled:border-line">
                <span className="size-2.5 scale-0 rounded-full bg-lime transition-transform duration-150 group-data-checked:scale-100 motion-reduce:transition-none" />
              </span>
              <span className="flex flex-col gap-1">
                <Label className="cursor-pointer text-sm font-semibold text-fg group-data-disabled:cursor-not-allowed group-data-disabled:text-fg-disabled">
                  {option.label}
                </Label>
                {option.description && (
                  <Description className="text-sm text-fg-muted group-data-disabled:text-fg-disabled">
                    {option.description}
                  </Description>
                )}
              </span>
            </Radio>
          </Field>
        ))}
      </HeadlessRadioGroup>
      {message && <FieldError>{message}</FieldError>}
    </Fieldset>
  )
}
