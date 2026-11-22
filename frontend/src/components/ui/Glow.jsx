import { cn } from '../../lib/cn.js'

const VARIANTS = {
  hero: 'bg-(image:--glow-hero)',
  auth: 'bg-(image:--glow-auth)',
  empty: 'bg-(image:--glow-empty)',
}

/**
 * Decorative blurred radial glow (magenta, violet, peach). Only for the hero, the
 * auth pages background and empty states, and never behind body text: place the
 * text outside the bright areas. `drift` moves it slowly (hero only, off in
 * reduced motion). The parent needs `relative isolate overflow-hidden`.
 */
export default function Glow({ variant = 'hero', drift = false, className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -inset-[10%] -z-10 blur-2xl',
        VARIANTS[variant],
        drift && 'motion-safe:animate-glow-drift',
        className,
      )}
    />
  )
}
