import { cn } from '../../lib/cn.js'

const TONES = {
  neutral: 'border-line bg-raised text-fg-muted',
  lime: 'border-transparent bg-lime text-on-lime',
  lavender: 'border-transparent bg-lavender text-plum',
  success: 'border-success/25 bg-success/12 text-success',
  warning: 'border-warning/25 bg-warning/12 text-warning',
  danger: 'border-danger/25 bg-danger/12 text-danger',
  info: 'border-info/25 bg-info/12 text-info',
}

const SIZES = {
  sm: 'h-6 gap-1 px-2.5 text-xs',
  md: 'h-7 gap-1.5 px-3 text-sm',
}

/**
 * Small status or category label.
 * @param {'neutral'|'lime'|'lavender'|'success'|'warning'|'danger'|'info'} tone
 * @example <Badge tone="success" icon={CircleCheck}>Payée</Badge>
 */
export default function Badge({
  tone = 'neutral',
  size = 'sm',
  icon: Icon,
  dot = false,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border font-semibold whitespace-nowrap',
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} aria-hidden="true" />}
      {children}
    </span>
  )
}
