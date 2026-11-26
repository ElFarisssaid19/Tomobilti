import { createContext, useContext } from 'react'
import { getFieldError, toErrorMessage } from '../../lib/validation.js'

/** Set by <FormField>: lets the control know it is wrapped and whether it is invalid. */
export const FieldContext = createContext(null)

export function useFieldContext() {
  return useContext(FieldContext)
}

/**
 * Shared logic of the form controls: when a control is not inside a <FormField>,
 * it wraps itself in one if it received a label, hint or error.
 */
export function useControlState({ label, hint, info, error, errors, name }) {
  const field = useFieldContext()
  const ownError = toErrorMessage(error) ?? getFieldError(errors, name)
  return {
    wrapped: Boolean(field),
    needsField: !field && Boolean(label || hint || info || ownError),
    invalid: field ? field.invalid : Boolean(ownError),
  }
}

/** Base classes of text-like controls (input, textarea, select button). */
export const CONTROL_CLASSES =
  'w-full rounded-input border border-line-control bg-surface text-base text-fg transition-[border-color,box-shadow,background-color] duration-150 ease-out data-hover:border-fg-subtle data-focus:border-lime focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-lime/35 data-invalid:border-danger data-invalid:focus-visible:outline-danger/35 data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-canvas data-disabled:text-fg-disabled sm:text-sm'
