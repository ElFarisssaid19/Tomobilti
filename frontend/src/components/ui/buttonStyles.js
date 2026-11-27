import { cn } from '../../lib/cn.js'

const BASE =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out motion-safe:active:scale-[0.98]'

const VARIANTS = {
  primary:
    'bg-lime text-on-lime hover:bg-lime-hover hover:shadow-glow-lime motion-safe:hover:-translate-y-px',
  secondary:
    'border border-line bg-raised text-fg hover:border-line-strong hover:bg-raised-hover motion-safe:hover:-translate-y-px',
  outline:
    'border border-line-control text-fg hover:border-fg-muted hover:bg-white/5 motion-safe:hover:-translate-y-px',
  ghost: 'text-fg-muted hover:bg-raised hover:text-fg',
  danger:
    'bg-danger text-on-lime hover:bg-danger-hover hover:shadow-[0_10px_36px_-12px_rgb(248_113_113/0.55)] motion-safe:hover:-translate-y-px',
  link: 'link-underline touch-target rounded-xs text-accent-text motion-safe:active:scale-100',
}

const DISABLED = {
  primary: 'bg-raised text-fg-disabled shadow-none',
  secondary: 'border-line bg-raised text-fg-disabled',
  outline: 'border-line text-fg-disabled',
  ghost: 'text-fg-disabled',
  danger: 'bg-raised text-fg-disabled shadow-none',
  link: 'text-fg-disabled',
}

const SIZES = {
  sm: 'touch-target h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
}

const ICON_ONLY_SIZES = {
  sm: 'touch-target size-9',
  md: 'size-11',
  lg: 'size-13',
}

export const ICON_SIZES = {
  sm: 'size-4',
  md: 'size-[1.125rem]',
  lg: 'size-5',
}

/**
 * Class names of a button, for elements that must look like a button without
 * being one (e.g. the decorative CTA inside a clickable CarCard).
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  disabled = false,
  loading = false,
  className,
} = {}) {
  const isLink = variant === 'link'
  return cn(
    BASE,
    VARIANTS[variant],
    !isLink && (iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size]),
    isLink && 'h-auto px-0',
    disabled &&
      !loading &&
      cn(
        DISABLED[variant],
        'pointer-events-none hover:translate-y-0 hover:shadow-none',
        variant === 'ghost' && 'hover:bg-transparent',
      ),
    loading && 'cursor-wait',
    className,
  )
}
