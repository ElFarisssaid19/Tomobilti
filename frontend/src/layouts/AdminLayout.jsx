import { ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import AdminNav from '../components/layout/AdminNav.jsx'
import Logo from '../components/layout/Logo.jsx'
import PageTransition from '../components/layout/PageTransition.jsx'
import { Avatar, Drawer, DropdownMenu, IconButton } from '../components/ui'
import { ADMIN_LINKS } from '../config/navigation.js'
import { cn } from '../lib/cn.js'

const STORAGE_KEY = 'tomobilti.admin.sidebarCollapsed'

function readCollapsed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/** Placeholder until auth (Phase 2) provides the signed-in admin. */
const ADMIN = { name: 'Administrateur', email: 'admin@tomobilti.ma' }

/**
 * Admin area: collapsible sidebar (desktop, remembered per browser), topbar with the
 * page title and the avatar menu, navigation drawer on mobile. No bottom nav here.
 */
export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const current =
    [...ADMIN_LINKS]
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
            <div className="ml-auto">
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-line bg-raised p-1 transition-colors hover:bg-raised-hover sm:pr-3"
                  >
                    <Avatar name={ADMIN.name} size="sm" decorative />
                    <span className="hidden text-sm font-semibold text-fg sm:inline">
                      {ADMIN.name}
                    </span>
                    <span className="sr-only sm:hidden">Menu du compte</span>
                  </button>
                }
                header={
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-fg">{ADMIN.name}</span>
                    <span className="text-xs text-fg-subtle">{ADMIN.email}</span>
                  </div>
                }
                items={[
                  { label: 'Mon profil', icon: UserRound, to: '/admin' },
                  { label: 'Voir le site', icon: ExternalLink, to: '/' },
                  { divider: true },
                  { label: 'Se déconnecter', icon: LogOut, danger: true, onClick: () => {} },
                ]}
              />
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
