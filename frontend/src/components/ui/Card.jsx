import { cn } from '../../lib/cn.js'
import { CARD_HOVER } from './cardStyles.js'

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

/**
 * Base surface. `size="lg"` gives the 28px radius used for large cards.
 * `interactive` adds the card hover: 4px lift, lighter border, soft violet glow.
 *
 * @example <Card padding="lg" size="lg">…</Card>
 */
export default function Card({
  as: Component = 'div',
  size = 'md',
  padding = 'md',
  tone = 'surface',
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'border border-line',
        size === 'lg' ? 'rounded-card-lg' : 'rounded-card',
        tone === 'raised' ? 'bg-raised' : 'bg-surface',
        PADDING[padding],
        interactive && CARD_HOVER,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
