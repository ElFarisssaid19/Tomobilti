import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '../../lib/cn.js'

/**
 * @param {{ label: string, to?: string }[]} items the last item is the current page
 * @example <Breadcrumbs items={[{ label: 'Accueil', to: '/' }, { label: 'Voitures', to: '/voitures' }, { label: 'Clio 5' }]} />
 */
export default function Breadcrumbs({ items = [], className }) {
  return (
    <nav aria-label="Fil d’Ariane" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className="link-underline rounded-xs text-fg-muted hover:text-fg"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(last ? 'font-medium text-fg' : 'text-fg-muted')}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
