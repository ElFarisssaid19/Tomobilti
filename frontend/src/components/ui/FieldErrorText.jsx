import { CircleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

/**
 * Error line for custom controls that are not inside a Headless UI <Field>
 * (link it yourself with aria-describedby).
 */
export function FieldErrorText({ id, className, children }) {
  return (
    <p
      id={id}
      className={cn('flex items-start gap-1.5 text-sm font-medium text-danger', className)}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
