import { cn } from '../../lib/cn.js'
import Breadcrumbs from './Breadcrumbs.jsx'

/**
 * Page title block: optional breadcrumbs, a large confident title, a description and
 * actions (right-aligned on desktop, below on mobile). Use `titleAs="h2"` when the
 * layout already renders the page's h1 (e.g. inside "Mon espace").
 * @example <PageHeader title="Bonjour, Said" description="Vos prochaines locations." actions={<Button>…</Button>} />
 */
export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  titleAs: Heading = 'h1',
  className,
}) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <Heading className="text-3xl font-bold text-fg sm:text-4xl">{title}</Heading>
          {description && <p className="text-base text-fg-muted sm:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
