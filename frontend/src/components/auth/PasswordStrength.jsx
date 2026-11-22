import { cn } from '../../lib/cn.js'
import { passwordStrength } from '../../lib/auth.js'

const SEGMENT_TONE = {
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-success',
  4: 'bg-success',
}

const LABEL_TONE = {
  1: 'text-danger',
  2: 'text-warning',
  3: 'text-success',
  4: 'text-success',
}

/**
 * Four-segment strength meter under a new-password field. Segments change color
 * through CSS transitions (no width animation); the label is announced politely.
 */
export default function PasswordStrength({ password }) {
  const { score, label } = passwordStrength(password)

  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-raised transition-colors duration-250',
              score >= segment && SEGMENT_TONE[score],
            )}
          />
        ))}
      </div>
      <p className={cn('min-w-20 text-right text-xs font-semibold', LABEL_TONE[score])}>
        {label && <span className="sr-only">Sécurité du mot de passe : </span>}
        {label}
      </p>
    </div>
  )
}
