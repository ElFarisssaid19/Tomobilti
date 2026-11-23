import { CalendarCheck, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../../context/authContext.js'
import useLogout from '../../hooks/useLogout.js'
import { firstName } from '../../lib/auth.js'
import { cn } from '../../lib/cn.js'
import { Avatar, DropdownMenu } from '../ui'

/**
 * Avatar menu of a signed-in user (navbar and admin topbar): Mes réservations,
 * Mon profil, Administration for admins, Déconnexion. `compact` shows the avatar alone.
 */
export default function UserMenu({ compact = false, className }) {
  const { user, isAdmin } = useAuth()
  const handleLogout = useLogout()

  if (!user) return null

  const items = [
    { label: 'Mes réservations', icon: CalendarCheck, to: '/espace/reservations' },
    { label: 'Mon profil', icon: UserRound, to: '/espace/profil' },
    ...(isAdmin ? [{ label: 'Administration', icon: LayoutDashboard, to: '/admin' }] : []),
    { divider: true },
    { label: 'Déconnexion', icon: LogOut, danger: true, onClick: handleLogout },
  ]

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-full border border-line bg-raised p-1 transition-colors duration-150 hover:border-line-strong hover:bg-raised-hover',
            !compact && 'lg:pr-3.5',
            className,
          )}
        >
          <Avatar name={user.name} size="sm" decorative />
          {!compact && (
            <span className="hidden max-w-32 truncate text-sm font-semibold text-fg lg:inline">
              {firstName(user)}
            </span>
          )}
          <span className={cn('sr-only', !compact && 'lg:hidden')}>
            Menu du compte de {user.name}
          </span>
        </button>
      }
      header={
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-fg">{user.name}</span>
          <span className="truncate text-xs text-fg-subtle">{user.email}</span>
        </div>
      }
      items={items}
    />
  )
}
