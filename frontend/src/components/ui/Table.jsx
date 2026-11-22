import { cn } from '../../lib/cn.js'
import Skeleton from './Skeleton.jsx'

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

/**
 * Data table for the admin: muted header, row hover, horizontal scroll on small screens.
 *
 * @param {{ key: string, header: string, render?: (row) => any, align?: 'left'|'right'|'center', className?: string }[]} columns
 * @param {object[]} rows
 * @param {string} caption accessible description of the table (visually hidden)
 * @param {import('react').ReactNode} empty shown when there is no row (e.g. an <EmptyState>)
 *
 * @example <Table caption="Réservations" columns={columns} rows={reservations} rowKey="reference" />
 */
export default function Table({
  columns = [],
  rows = [],
  rowKey = 'id',
  caption,
  loading = false,
  skeletonRows = 5,
  empty,
  onRowClick,
  className,
}) {
  if (!loading && rows.length === 0 && empty) return empty

  return (
    <div className={cn('overflow-x-auto rounded-card border border-line bg-surface', className)}>
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'h-11 bg-raised/40 px-4 text-xs font-semibold whitespace-nowrap text-fg-subtle first:pl-5 last:pr-5',
                  ALIGN[column.align ?? 'left'],
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {loading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index} aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.key} className="h-14 px-4 first:pl-5 last:pr-5">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors duration-150 hover:bg-raised/60',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'h-14 px-4 whitespace-nowrap text-fg first:pl-5 last:pr-5',
                        ALIGN[column.align ?? 'left'],
                        column.className,
                      )}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
