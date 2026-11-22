import { cn } from '../../lib/cn.js'

/**
 * Shimmering placeholder block. Size it like the content it replaces so nothing
 * moves when the data arrives. The shimmer stops in reduced motion.
 * @example <Skeleton className="h-6 w-40" />
 */
export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('skeleton rounded-sm', className)} />
}

/** A few lines of text. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2.5', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/**
 * Wrap skeletons in this so screen readers hear one "loading" message instead of
 * nothing. Keep the visual layout identical to the loaded state.
 */
export function LoadingRegion({ label = 'Chargement…', className, children }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
