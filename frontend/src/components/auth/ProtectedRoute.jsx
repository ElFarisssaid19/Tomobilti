import { useIsPresent } from 'motion/react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/authContext.js'
import { PageSkeleton } from '../layout/PageSkeleton.jsx'

/**
 * Pages for signed-in users. Guests go to /connexion?redirect=<this page> and come
 * back here after logging in.
 *
 * While its page animates out (PageTransition keeps it mounted), the guard never
 * redirects: it would read the next page's location and redirect in a loop. If the
 * user logged out meanwhile, the leaving page simply disappears.
 */
export default function ProtectedRoute() {
  const { status, loggedOut } = useAuth()
  const location = useLocation()
  const isPresent = useIsPresent()

  if (!isPresent) return status === 'authenticated' ? <Outlet /> : null
  if (status === 'loading') return <PageSkeleton label="Chargement de votre espace…" />
  if (status === 'guest') {
    // After "Déconnexion" the user goes home, not to the login page.
    if (loggedOut) return <Navigate to="/" replace />
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />
  }
  return <Outlet />
}
