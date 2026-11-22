import { LayoutGroup, motion } from 'motion/react'
import { NavLink } from 'react-router'
import PageTransition from '../components/layout/PageTransition.jsx'
import { PageHeader } from '../components/ui'
import { CLIENT_LINKS } from '../config/navigation.js'
import { cn } from '../lib/cn.js'
import { spring } from '../lib/motion.js'

/**
 * "Mon espace" (client area), nested in PublicLayout so it shares the navbar, the
 * footer and the mobile bottom nav. Its tabs are links; the lime pill slides between them.
 */
export default function ClientLayout() {
  return (
    <div className="container-page flex flex-1 flex-col gap-8 pt-24 pb-16 md:pt-32">
      <PageHeader
        title="Mon espace"
        description="Vos réservations et vos informations personnelles."
      />

      <nav aria-label="Mon espace">
        <LayoutGroup id="client-tabs">
          <ul className="scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
            {CLIENT_LINKS.map(({ label, to, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'relative isolate inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                      isActive ? 'text-on-lime' : 'text-fg-muted hover:text-fg',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="client-tab"
                          transition={spring}
                          aria-hidden="true"
                          className="absolute inset-0 -z-10 rounded-full bg-lime"
                        />
                      )}
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </LayoutGroup>
      </nav>

      <PageTransition className="flex flex-1 flex-col" />
    </div>
  )
}
