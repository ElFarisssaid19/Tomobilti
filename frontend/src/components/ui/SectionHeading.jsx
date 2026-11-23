import { Link } from 'react-router'
import { cn } from '../../lib/cn.js'

/**
 * Section title with an optional "Voir tout" link on the right.
 * @example <SectionHeading title="Voitures à la une" to="/voitures" />
 */
export default function SectionHeading({
  title,
  description,
  to,
  linkLabel = 'Voir tout',
  as: Heading = 'h2',
  id,
  className,
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="flex flex-col gap-1">
        <Heading id={id} className="scroll-mt-28 text-2xl font-bold text-fg">
          {title}
        </Heading>
        {description && <p className="text-base text-fg-muted">{description}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="link-underline shrink-0 rounded-xs text-sm font-semibold text-accent-text"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}
