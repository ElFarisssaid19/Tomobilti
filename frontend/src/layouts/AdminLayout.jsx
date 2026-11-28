import { ChevronsLeft, ChevronsRight, Menu } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import AdminNav from '../components/layout/AdminNav.jsx'
import Logo from '../components/layout/Logo.jsx'
import NotificationBell from '../components/notifications/NotificationBell.jsx'
import PageTransition from '../components/layout/PageTransition.jsx'
import UserMenu from '../components/auth/UserMenu.jsx'
import { Drawer, IconButton } from '../components/ui'
import { ADMIN_EXTRA_PAGES, ADMIN_LINKS } from '../config/navigation.js'
import { cn } from '../lib/cn.js'

const STORAGE_KEY = 'tomobilti.admin.sidebarCollapsed'

function readCollapsed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Admin area: collapsible sidebar (desktop, remembered per browser), topbar with the
 * page title and the avatar menu, navigation drawer on mobile. No bottom nav here.
 * Rendered inside AdminRoute (lazy-loaded), so the user is always an admin here.
 */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const current =
    [...ADMIN_LINKS, ...ADMIN_EXTRA_PAGES]
      .reverse()
      .find((link) => (link.end ? pathname === link.to : pathname.startsWith(link.to))) ??
    ADMIN_LINKS[0]

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // Storage unavailable (private mode): the choice is kept for this visit only.
    }
  }

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/60 py-5 lg:flex',
          collapsed ? 'w-20 items-center px-4.5' : 'w-64 px-4',
        )}
      >
        <div className={cn('flex h-10 items-center', collapsed ? 'justify-center' : 'px-2')}>
          {collapsed ? (
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-lime text-lg font-extrabold text-on-lime"
            >
              t
            </span>
          ) : (
            <Logo to="/admin" />
          )}
        </div>
        <div className="mt-8 flex-1">
          <AdminNav collapsed={collapsed} />
        </div>
        <IconButton
          icon={collapsed ? ChevronsRight : ChevronsLeft}
          label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={collapsed ? '' : 'self-end'}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-(--z-sticky) border-b border-line/80 glass">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <IconButton
              icon={Menu}
              label="Ouvrir le menu"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden"
            />
            <p className="truncate text-base font-semibold text-fg">{current.label}</p>
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu variant="admin" />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
          <PageTransition className="mx-auto flex w-full max-w-page flex-1 flex-col" />
        </main>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        title="Administration"
      >
        <AdminNav onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}
