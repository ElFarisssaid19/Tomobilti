import { NavLink } from 'react-router'
import { ADMIN_LINKS } from '../../config/navigation.js'
import { usePendingCount } from '../../hooks/useAdmin.js'
import { cn } from '../../lib/cn.js'
import { formatNumber } from '../../utils/format.js'
import { Tooltip } from '../ui'

/**
 * Admin navigation list. `collapsed` shows icons only (with tooltips); used in the
 * desktop sidebar and, expanded, in the mobile drawer. "Réservations" carries the
 * number of requests to answer, refreshed every 60 seconds.
 */
export default function AdminNav({ collapsed = false, onNavigate }) {
  const { data: pending = 0 } = usePendingCount()

  return (
    <nav aria-label="Administration">
      <ul className="flex flex-col gap-1">
        {ADMIN_LINKS.map(({ label, to, icon: Icon, end, badge }) => {
          const count = badge === 'pending' ? pending : 0
          const countLabel = count > 0 ? `, ${count} à traiter` : ''
          const link = (
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              aria-label={collapsed || count > 0 ? `${label}${countLabel}` : undefined}
              className={({ isActive }) =>
                cn(
                  'relative flex h-11 items-center gap-3 rounded-input text-sm font-semibold transition-colors duration-150',
                  collapsed ? 'w-11 justify-center' : 'px-3.5',
                  isActive ? 'bg-lime text-on-lime' : 'text-fg-muted hover:bg-raised hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {count > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums',
                        collapsed ? 'absolute -top-1 -right-1' : 'ml-auto',
                        isActive
                          ? 'bg-on-lime text-lime'
                          : 'border border-warning/30 bg-warning/15 text-warning',
                      )}
                    >
                      {count > 99 ? '99+' : formatNumber(count)}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
          return (
            <li key={to}>
              {collapsed ? (
                <Tooltip content={`${label}${countLabel}`} side="right">
                  {link}
                </Tooltip>
              ) : (
                link
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
