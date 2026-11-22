import { LogIn, Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { PUBLIC_LINKS } from '../../config/navigation.js'
import useScrolled from '../../hooks/useScrolled.js'
import { cn } from '../../lib/cn.js'
import { Button, Drawer, IconButton } from '../ui'
import Logo from './Logo.jsx'

/**
 * Public top bar. Transparent over the hero, then glass (blur) with a border after
 * scrolling. Desktop: links + Connexion / Inscription. Mobile: compact bar with a
 * menu sheet (the main mobile navigation is the bottom nav).
 */
export default function SiteHeader() {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-(--z-sticky) border-b transition-[background-color,border-color,backdrop-filter] duration-250',
        scrolled ? 'border-line/80 glass' : 'border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-18">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'link-underline rounded-xs text-sm font-semibold transition-colors',
                      isActive ? 'text-fg after:bg-lime' : 'text-fg-muted hover:text-fg',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button to="/connexion" variant="ghost" size="sm">
            Connexion
          </Button>
          <Button to="/inscription" size="sm">
            Inscription
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <IconButton icon={LogIn} label="Connexion" size="sm" to="/connexion" />
          <IconButton
            icon={Menu}
            label="Ouvrir le menu"
            size="sm"
            onClick={() => setMenuOpen(true)}
          />
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
          <Button to="/inscription" size="lg" onClick={() => setMenuOpen(false)}>
            Créer un compte
          </Button>
          <Button to="/connexion" variant="secondary" size="lg" onClick={() => setMenuOpen(false)}>
            Connexion
          </Button>
        </div>
      </Drawer>
    </header>
  )
}
