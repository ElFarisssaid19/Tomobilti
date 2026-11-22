import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../context/authContext.js'

/**
 * Log out from anywhere (navbar, mobile menu, admin topbar), then go home with a toast.
 * Protected pages also send a logged-out user home (see `loggedOut` in AuthContext).
 */
export default function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useCallback(async () => {
    try {
      await logout()
    } catch {
      toast.error('La déconnexion a échoué', { description: 'Réessayez dans un instant.' })
      return
    }
    navigate('/', { replace: true })
    toast.success('Vous êtes déconnecté')
  }, [logout, navigate])
}
