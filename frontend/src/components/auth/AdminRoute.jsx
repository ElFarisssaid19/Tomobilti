import { useIsPresent } from 'motion/react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/authContext.js'
import ForbiddenPage from '../../pages/ForbiddenPage.jsx'
import { AdminPageSkeleton } from '../layout/PageSkeleton.jsx'

/**
 * Admin area. Guests go to the login page, clients see the French 403 page. The API
 * enforces the same rule (admin middleware): this guard only spares a useless screen.
 * Like ProtectedRoute, it stays inert while its page animates out.
 */
export default function AdminRoute() {
  const { status, isAdmin, loggedOut } = useAuth()
  const location = useLocation()
  const isPresent = useIsPresent()

  if (!isPresent) return status === 'authenticated' && isAdmin ? <Outlet /> : null
  if (status === 'loading') return <AdminPageSkeleton />
  if (status === 'guest') {
    // After "Déconnexion" the user goes home, not to the login page.
    if (loggedOut) return <Navigate to="/" replace />
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />
  }
  if (!isAdmin) return <ForbiddenPage />
  return <Outlet />
}
