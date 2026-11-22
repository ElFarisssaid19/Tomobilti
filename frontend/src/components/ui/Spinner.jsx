import { cn } from '../../lib/cn.js'

const SIZES = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
}

/**
 * Loading indicator. Decorative by default (inside a busy button); pass `label`
 * to announce it as a status on its own.
 */
export default function Spinner({ size = 'md', label, className }) {
  const svg = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0 animate-spin', SIZES[size], className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )

  if (!label) return svg

  return (
    <span role="status" className="inline-flex items-center gap-2">
      {svg}
      <span className="sr-only">{label}</span>
    </span>
  )
}
