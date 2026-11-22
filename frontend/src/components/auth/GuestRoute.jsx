import { useIsPresent } from 'motion/react'
import { Navigate, Outlet, useSearchParams } from 'react-router'
import { useAuth } from '../../context/authContext.js'
import { homePathFor } from '../../lib/auth.js'
import { PageSkeleton } from '../layout/PageSkeleton.jsx'

/**
 * Pages for visitors only (login, register, forgot/reset password). A signed-in user
 * is sent where they belong: admins to /admin, clients to `?redirect=` or their profile.
 * This is also what moves the user on after a successful login or registration.
 * While its page animates out, it keeps showing that page and never redirects.
 */
export default function GuestRoute() {
  const { status, user } = useAuth()
  const [searchParams] = useSearchParams()
  const isPresent = useIsPresent()

  if (!isPresent) return <Outlet />
  if (status === 'loading') return <PageSkeleton />
  if (status === 'authenticated') {
    return <Navigate to={homePathFor(user, searchParams.get('redirect'))} replace />
  }
  return <Outlet />
}
