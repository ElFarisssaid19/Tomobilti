import { LayoutGroup, motion } from 'motion/react'
import { NavLink } from 'react-router'
import { BOTTOM_NAV } from '../../config/navigation.js'
import { cn } from '../../lib/cn.js'
import { spring } from '../../lib/motion.js'

/**
 * Floating glass bottom navigation (mobile only, public and client areas).
 * The active item sits in a lime circle that slides between items (shared layout).
 * Layouts using it add `pb-28 md:pb-0` so it never hides content.
 */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-(--z-nav) px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <LayoutGroup id="bottom-nav">
        <ul className="mx-auto flex max-w-md items-stretch justify-between rounded-full border border-white/10 glass p-1.5 shadow-pop">
          {BOTTOM_NAV.map(({ label, to, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className="group flex flex-col items-center gap-0.5 rounded-full py-1 focus-visible:outline-offset-0"
              >
                {({ isActive }) => (
                  <>
                    <span className="relative grid size-10 place-items-center">
                      {isActive && (
                        <motion.span
                          layoutId="bottom-nav-active"
                          transition={spring}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-lime shadow-glow-lime"
                        />
                      )}
                      <Icon
                        className={cn(
                          'relative size-5 transition-colors duration-150',
                          isActive ? 'text-on-lime' : 'text-fg-muted group-hover:text-fg',
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      className={cn(
                        'text-[0.6875rem] leading-4 font-semibold transition-colors duration-150',
                        isActive ? 'text-fg' : 'text-fg-muted',
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </nav>
  )
}
