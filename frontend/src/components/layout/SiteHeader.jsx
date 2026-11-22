import { LayoutDashboard, LogIn, LogOut, Menu, UserRound } from 'lucide-react'
import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { PUBLIC_LINKS } from '../../config/navigation.js'
import { useAuth } from '../../context/authContext.js'
import useLogout from '../../hooks/useLogout.js'
import useScrollDirection from '../../hooks/useScrollDirection.js'
import useScrolled from '../../hooks/useScrolled.js'
import { cn } from '../../lib/cn.js'
import { spring } from '../../lib/motion.js'
import UserMenu from '../auth/UserMenu.jsx'
import { Button, Drawer, IconButton, Skeleton } from '../ui'
import Logo from './Logo.jsx'

/** Below this scroll position the navbar always stays visible (over the hero). */
const HIDE_AFTER = 240

/**
 * Public navigation.
 *
 * - Mobile: compact top bar (logo, Connexion, menu sheet); the main mobile navigation
 *   is the floating bottom nav.
 * - Desktop (md+): a floating glass pill, 16px from the top, max 1100px wide, matching
 *   the bottom nav. The active link sits in a lime pill that slides between links.
 *   After scrolling it becomes more opaque and slightly more compact; it tucks away
 *   while scrolling down past the hero and comes back on any upward scroll. It never
 *   hides at the top of the page, while it holds keyboard focus, while the menu is open
 *   or when the user asks for reduced motion.
 *
 * Actions follow the session: Connexion / Inscription for visitors, the avatar menu
 * (Mon espace, Administration, Déconnexion) once signed in, and a placeholder of the
 * same size while the session loads, so nothing jumps.
 */
export default function SiteHeader() {
  const { status, isAdmin } = useAuth()
  const handleLogout = useLogout()
  const scrolled = useScrolled()
  const pastHero = useScrolled(HIDE_AFTER)
  const direction = useScrollDirection()
  const reduceMotion = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const hidden = pastHero && direction === 'down' && !menuOpen && !focusWithin && !reduceMotion

  return (
    <header
      className="fixed inset-x-0 top-0 z-(--z-sticky)"
      onFocus={() => setFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false)
      }}
    >
      {/* Mobile: compact top bar */}
      <div
        className={cn(
          'border-b transition-[background-color,border-color] duration-250 md:hidden',
          scrolled ? 'border-line/80 glass' : 'border-transparent bg-transparent',
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-2">
            {status === 'loading' && <Skeleton className="size-9 rounded-full" />}
            {status === 'guest' && (
              <IconButton icon={LogIn} label="Connexion" size="sm" to="/connexion" />
            )}
            {status === 'authenticated' && <UserMenu compact />}
            <IconButton
              icon={Menu}
              label="Ouvrir le menu"
              size="sm"
              onClick={() => setMenuOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Desktop: floating glass pill */}
      <div
        className={cn(
          'hidden px-6 pt-4 transition-transform duration-400 ease-out motion-reduce:transition-none md:block',
          hidden && '-translate-y-[calc(100%+1rem)]',
        )}
      >
        <div
          className={cn(
            'mx-auto grid h-16 max-w-nav grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border pr-2 pl-5 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow,transform] duration-250 ease-out motion-reduce:transition-none lg:gap-4 lg:pl-6 [@media(prefers-reduced-transparency:reduce)]:bg-raised',
            scrolled
              ? 'border-white/12 bg-raised/90 shadow-pop motion-safe:-translate-y-1.5 motion-safe:scale-[0.98]'
              : 'border-white/8 bg-raised/60',
          )}
        >
          <Logo className="justify-self-start" />

          <nav aria-label="Navigation principale">
            <LayoutGroup id="site-nav">
              <ul className="flex items-center gap-1">
                {PUBLIC_LINKS.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        cn(
                          'relative isolate inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-150 lg:px-4',
                          isActive
                            ? 'text-on-lime'
                            : 'text-fg-muted hover:bg-white/8 hover:text-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="site-nav-pill"
                              transition={spring}
                              aria-hidden="true"
                              className="absolute inset-0 -z-10 rounded-full bg-lime"
                            />
                          )}
                          {link.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </LayoutGroup>
          </nav>

          <div className="flex items-center gap-1.5 justify-self-end">
            {status === 'loading' && <Skeleton className="h-10 w-28 rounded-full lg:w-40" />}
            {status === 'guest' && (
              <>
                {/* md (768–1023px) is too narrow for two text buttons: Connexion becomes an icon. */}
                <IconButton
                  icon={LogIn}
                  label="Connexion"
                  variant="ghost"
                  size="sm"
                  to="/connexion"
                  className="lg:hidden"
                />
                <Button to="/connexion" variant="ghost" size="sm" className="hidden lg:inline-flex">
                  Connexion
                </Button>
                <Button to="/inscription" size="sm">
                  Inscription
                </Button>
              </>
            )}
            {status === 'authenticated' && <UserMenu />}
          </div>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <nav aria-label="Menu mobile">
          <ul className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex h-12 items-center rounded-input px-4 text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-raised text-fg'
                        : 'text-fg-muted hover:bg-raised hover:text-fg',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-6">
          {status === 'authenticated' ? (
            <>
              <Button
                to="/espace/profil"
                size="lg"
                leftIcon={UserRound}
                onClick={() => setMenuOpen(false)}
              >
                Mon espace
              </Button>
              {isAdmin && (
                <Button
                  to="/admin"
                  variant="secondary"
                  size="lg"
                  leftIcon={LayoutDashboard}
                  onClick={() => setMenuOpen(false)}
                >
                  Administration
                </Button>
              )}
              <Button
                variant="ghost"
                size="lg"
                leftIcon={LogOut}
                onClick={() => {
                  setMenuOpen(false)
                  handleLogout()
                }}
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button to="/inscription" size="lg" onClick={() => setMenuOpen(false)}>
                Créer un compte
              </Button>
              <Button
                to="/connexion"
                variant="secondary"
                size="lg"
                onClick={() => setMenuOpen(false)}
              >
                Connexion
              </Button>
            </>
          )}
        </div>
      </Drawer>
    </header>
  )
}
