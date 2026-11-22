import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { getCsrfCookie, onUnauthorized } from '../api/client.js'
import { AuthContext } from './authContext.js'

/**
 * Loads the signed-in user once on start (CSRF cookie, then GET /api/user) and
 * shares it with the whole app through `useAuth()`.
 *
 * status: 'loading' until the first answer, then 'authenticated' or 'guest'.
 * Route guards wait for 'loading' to end, so the wrong page never flashes.
 * `loggedOut` tells them the user chose to log out (go home) rather than lost the
 * session (go to the login page and come back).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, status: 'loading', loggedOut: false })
  const { user, status, loggedOut } = session

  const setUser = useCallback((nextUser) => {
    setSession({ user: nextUser, status: nextUser ? 'authenticated' : 'guest', loggedOut: false })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.fetchCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      // 401 means "not signed in"; a network error is treated the same way.
      if (error.response?.status !== 401) console.warn('Impossible de charger l’utilisateur', error)
      setUser(null)
      return null
    }
  }, [setUser])

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        await getCsrfCookie()
        const currentUser = await authApi.fetchCurrentUser()
        if (!cancelled) setUser(currentUser)
      } catch {
        if (!cancelled) setUser(null)
      }
    }

    loadUser()
    return () => {
      cancelled = true
    }
  }, [setUser])

  // A 401 on any request (session expired, logged out in another tab) clears the user.
  useEffect(() => onUnauthorized(() => setUser(null)), [setUser])

  const login = useCallback(
    async (credentials) => {
      const loggedInUser = await authApi.login(credentials)
      setUser(loggedInUser)
      return loggedInUser
    },
    [setUser],
  )

  const register = useCallback(
    async (payload) => {
      const newUser = await authApi.register(payload)
      setUser(newUser)
      return newUser
    },
    [setUser],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // 401: the session had already ended, which is the goal anyway.
      if (error.response?.status !== 401) throw error
    }
    setSession({ user: null, status: 'guest', loggedOut: true })
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      loggedOut,
      isAdmin: Boolean(user?.is_admin),
      isVerified: Boolean(user?.email_verified_at),
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, status, loggedOut, login, register, logout, refreshUser, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
