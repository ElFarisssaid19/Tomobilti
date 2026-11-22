import { NavLink } from 'react-router'
import { ADMIN_LINKS } from '../../config/navigation.js'
import { cn } from '../../lib/cn.js'
import { Tooltip } from '../ui'

/**
 * Admin navigation list. `collapsed` shows icons only (with tooltips); used in the
 * desktop sidebar and, expanded, in the mobile drawer.
 */
export default function AdminNav({ collapsed = false, onNavigate }) {
  return (
    <nav aria-label="Administration">
      <ul className="flex flex-col gap-1">
        {ADMIN_LINKS.map(({ label, to, icon: Icon, end }) => {
          const link = (
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              aria-label={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-input text-sm font-semibold transition-colors duration-150',
                  collapsed ? 'w-11 justify-center' : 'px-3.5',
                  isActive ? 'bg-lime text-on-lime' : 'text-fg-muted hover:bg-raised hover:text-fg',
                )
              }
            >
              <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
          return (
            <li key={to}>
              {collapsed ? (
                <Tooltip content={label} side="right">
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
