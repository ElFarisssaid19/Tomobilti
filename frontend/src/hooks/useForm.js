import { useState } from 'react'
import { toast } from 'sonner'
import { apiErrorMessage, focusFirstInvalid, isValidationError } from '../lib/auth.js'

/**
 * State of a small form: values, errors (client-side object or the axios 422 error,
 * both understood by FormField's `errors` prop) and the submitting flag.
 *
 * @example
 * const form = useForm({ name: user.name })
 * <form onSubmit={(e) => form.handleSubmit(e, { send })}>
 *   <Input label="Nom" {...form.field('name')} />
 */
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function field(name) {
    return {
      name,
      value: values[name] ?? '',
      onChange: (event) => setValues((current) => ({ ...current, [name]: event.target.value })),
      errors,
    }
  }

  /**
   * Runs `validate` (returns `{ field: [message] }`), then `send`. 422 errors go to
   * the fields; other errors become an error toast titled `errorTitle`.
   * @returns {Promise<boolean>} true when `send` succeeded
   */
  async function handleSubmit(event, { validate, send, errorTitle = 'L’enregistrement a échoué' }) {
    event.preventDefault()
    // Kept now: React clears event.currentTarget once the handler awaits.
    const formElement = event.currentTarget

    const clientErrors = validate?.(values) ?? {}
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      focusFirstInvalid(formElement)
      return false
    }

    setErrors(null)
    setSubmitting(true)
    try {
      await send(values)
      return true
    } catch (error) {
      if (isValidationError(error)) {
        setErrors(error)
        focusFirstInvalid(formElement)
      } else {
        toast.error(errorTitle, { description: apiErrorMessage(error) })
      }
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { values, setValues, errors, submitting, field, handleSubmit }
}
