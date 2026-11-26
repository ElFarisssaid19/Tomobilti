import useMediaQuery from '../../hooks/useMediaQuery.js'
import { cn } from '../../lib/cn.js'
import Skeleton from './Skeleton.jsx'

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

const BREAKPOINT = {
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
}

/** Role of each column in the card layout (see `card` below). */
function cardRoles(columns) {
  const roleOf = (column, index) => {
    if (column.card !== undefined) return column.card || 'hidden'
    if (column.key === 'actions') return 'actions'
    return index === 0 ? 'title' : 'field'
  }
  const roles = columns.map((column, index) => ({ column, role: roleOf(column, index) }))
  // An explicit title wins over the "first column" default.
  if (roles.some(({ column }) => column.card === 'title')) {
    for (const entry of roles) {
      if (entry.role === 'title' && entry.column.card !== 'title') entry.role = 'field'
    }
  }
  const pick = (role) => roles.filter((entry) => entry.role === role).map((entry) => entry.column)
  return {
    title: pick('title'),
    status: pick('status'),
    actions: pick('actions'),
    fields: roles
      .filter((entry) => entry.role === 'field' || entry.role === 'wide')
      .map((entry) => ({ ...entry.column, wide: entry.role === 'wide' })),
  }
}

function cell(column, row, forCard = false) {
  if (forCard && column.cardRender) return column.cardRender(row)
  return column.render ? column.render(row) : row[column.key]
}

/**
 * Data table for the admin. From `breakpoint` (lg by default) it is a real table;
 * below, every row becomes a card, so nothing is cut off on a phone: the title column
 * at the top with the actions on the right, the status under it, then every other
 * field as a label and its value (wrapping, never truncated).
 *
 * Column options:
 * - `card`: `'title'` (default for the first column), `'status'`, `'actions'` (default
 *   for the `actions` key), `'wide'` (a field on the full card width, e.g. an address),
 *   `false` (not shown on cards, e.g. an icon). Other columns are fields.
 * - `cardLabel`: the field label on cards (defaults to `header`).
 * - `cardRender(row)`: what the card shows instead of `render(row)`.
 *
 * @param {{ key: string, header: string, render?: (row) => any, align?: 'left'|'right'|'center', className?: string, card?: string|false, cardLabel?: string, cardRender?: (row) => any }[]} columns
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
  breakpoint = 'lg',
  className,
}) {
  const isWide = useMediaQuery(BREAKPOINT[breakpoint] ?? BREAKPOINT.lg)

  if (!loading && rows.length === 0 && empty) return empty

  if (!isWide) {
    return (
      <TableCards
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        caption={caption}
        loading={loading}
        skeletonRows={Math.min(skeletonRows, 3)}
        onRowClick={onRowClick}
        className={className}
      />
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-x-auto rounded-card border border-line bg-surface',
        className,
      )}
    >
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
                      {cell(column, row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

/** The card layout of <Table> (below its breakpoint). */
function TableCards({
  columns,
  rows,
  rowKey,
  caption,
  loading,
  skeletonRows,
  onRowClick,
  className,
}) {
  if (loading) {
    return (
      <div
        role="status"
        aria-label={caption ? `Chargement : ${caption}` : 'Chargement…'}
        className={cn('flex flex-col gap-3', className)}
      >
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-card" />
        ))}
      </div>
    )
  }

  const { title, status, actions, fields } = cardRoles(columns)
  const label = (column) =>
    column.cardLabel ?? (typeof column.header === 'string' ? column.header : column.key)

  return (
    <ul aria-label={caption} className={cn('flex flex-col gap-3', className)}>
      {rows.map((row) => (
        <li
          key={row[rowKey]}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={cn(
            'flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm text-fg transition-colors duration-150',
            onRowClick && 'cursor-pointer hover:border-line-strong hover:bg-raised/40',
          )}
        >
          {(title.length > 0 || actions.length > 0) && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1 break-words">
                {title.map((column) => (
                  <div key={column.key} className="min-w-0">
                    {cell(column, row, true)}
                  </div>
                ))}
              </div>
              {actions.length > 0 && (
                <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-1">
                  {actions.map((column) => (
                    <span key={column.key} className="inline-flex">
                      {cell(column, row, true)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {status.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {status.map((column) => (
                <span key={column.key} className="inline-flex">
                  {cell(column, row, true)}
                </span>
              ))}
            </div>
          )}
          {fields.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3">
              {fields.map((column) => (
                <div key={column.key} className={cn('min-w-0', column.wide && 'col-span-2')}>
                  <dt className="text-xs font-medium text-fg-subtle">{label(column)}</dt>
                  <dd className="mt-0.5 break-words text-fg">{cell(column, row, true) ?? '—'}</dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ul>
  )
}
