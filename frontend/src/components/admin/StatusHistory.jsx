import { Bot, ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { formatDate } from '../../utils/format.js'
import { StatusBadge } from '../ui'

const WHEN = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }

function author(entry) {
  if (!entry.author) return { icon: Bot, text: 'Automatique (demande expirée)' }
  if (entry.author.role === 'admin') return { icon: ShieldCheck, text: entry.author.name }
  return { icon: UserRound, text: `${entry.author.name} (client)` }
}

/**
 * Full status history of a reservation, oldest first: the new status, who made the
 * change (agency, customer or the scheduler), when, and the reason.
 */
export default function StatusHistory({ history = [], className }) {
  if (history.length === 0) {
    return <p className="text-sm text-fg-muted">Aucun changement de statut enregistré.</p>
  }

  return (
    <ol className={cn('flex flex-col', className)}>
      {history.map((entry, index) => {
        const who = author(entry)
        const WhoIcon = who.icon
        const isLast = index === history.length - 1
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-8 bottom-0 left-[0.9375rem] w-0.5 rounded-full bg-line"
              />
            )}
            <span className="relative grid size-8 shrink-0 place-items-center rounded-full border border-line-strong bg-raised text-fg-muted">
              <WhoIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={entry.to_status} />
                <span className="text-sm text-fg-muted">
                  {entry.from_status ? `après « ${entry.from_status_label} »` : 'Demande créée'}
                </span>
              </div>
              <p className="flex flex-col text-sm">
                <span className="text-fg">{who.text}</span>
                <time dateTime={entry.created_at} className="text-fg-muted tabular-nums">
                  {formatDate(entry.created_at, WHEN)}
                </time>
              </p>
              {entry.note && (
                <p className="rounded-input border border-line bg-raised/50 px-3 py-2 text-sm text-fg-muted">
                  {entry.note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
