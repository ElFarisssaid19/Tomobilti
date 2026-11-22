import { createContext, useContext } from 'react'

/** Value provided by <AuthProvider> (src/context/AuthContext.jsx). */
export const AuthContext = createContext(null)

/**
 * Current user and auth actions.
 *
 * @returns {{
 *   user: object | null,
 *   status: 'loading' | 'authenticated' | 'guest',
 *   loggedOut: boolean,
 *   isAdmin: boolean,
 *   isVerified: boolean,
 *   login: (credentials: { email: string, password: string, remember?: boolean }) => Promise<object>,
 *   register: (payload: object) => Promise<object>,
 *   logout: () => Promise<void>,
 *   refreshUser: () => Promise<object | null>,
 *   setUser: (user: object | null) => void,
 * }}
 */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.')
  return value
}
