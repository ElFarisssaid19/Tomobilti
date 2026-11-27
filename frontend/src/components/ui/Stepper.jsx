import { Check } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const RESERVATION_STEPS = ['Dates', 'Options', 'Informations', 'Confirmation']

/**
 * Progress through a sequence (the reservation flow). `current` is the 0-based index.
 * On small screens only the current step shows its label (the others stay readable by
 * screen readers).
 * @example <Stepper current={1} />
 */
export default function Stepper({
  steps = RESERVATION_STEPS,
  current = 0,
  label = 'Étapes de la réservation',
  className,
}) {
  return (
    <nav aria-label={label} className={className}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center gap-2">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 right-[calc(-50%+1.25rem)] left-[calc(50%+1.25rem)] h-0.5 overflow-hidden rounded-full bg-line"
                >
                  <span
                    className={cn(
                      'block h-full origin-left bg-lime transition-transform duration-400 ease-out motion-reduce:transition-none',
                      done ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </span>
              )}
              <span
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative grid size-8 place-items-center rounded-full border text-sm font-bold tabular-nums transition-colors duration-250',
                  done && 'border-lime bg-lime text-on-lime',
                  active && 'border-lime bg-canvas text-accent-text shadow-glow-lime',
                  !done && !active && 'border-line bg-raised text-fg-subtle',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
                <span className="sr-only">
                  {done ? ' (terminée)' : active ? ' (en cours)' : ''}
                </span>
              </span>
              <span
                className={cn(
                  'text-center text-xs font-semibold sm:text-sm',
                  // Small screens show the current label only; the others stay for screen readers.
                  active ? 'text-fg' : 'sr-only text-fg-muted sm:not-sr-only',
                )}
              >
                {step}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
