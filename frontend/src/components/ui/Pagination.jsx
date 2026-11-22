import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import IconButton from './IconButton.jsx'

/** Pages to show: first, last, current ± 1, with "…" gaps. */
function pageRange(page, lastPage) {
  const pages = new Set([1, lastPage, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b)
  return sorted.flatMap((p, index) => (index > 0 && p - sorted[index - 1] > 1 ? ['gap', p] : [p]))
}

/**
 * Pagination matching Laravel's paginator (`meta.current_page`, `meta.last_page`).
 * @example <Pagination page={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
 */
export default function Pagination({ page, lastPage, onPageChange, className }) {
  if (!lastPage || lastPage <= 1) return null

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      <IconButton
        icon={ChevronLeft}
        label="Page précédente"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <ul className="flex items-center gap-1">
        {pageRange(page, lastPage).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="w-6 text-center text-fg-subtle">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'grid size-9 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-150',
                  item === page
                    ? 'bg-lime text-on-lime'
                    : 'text-fg-muted hover:bg-raised hover:text-fg',
                )}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>
      <IconButton
        icon={ChevronRight}
        label="Page suivante"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  )
}
