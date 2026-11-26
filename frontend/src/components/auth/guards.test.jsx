import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../context/authContext.js'
import PageTransition from '../layout/PageTransition.jsx'
import AdminRoute from './AdminRoute.jsx'
import GuestRoute from './GuestRoute.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

const CLIENT = { id: 1, name: 'Salma Bennani', is_admin: false }
const ADMIN = { id: 2, name: 'Karim Admin', is_admin: true }

function auth(status, user = null, { loggedOut = false } = {}) {
  return { status, user, loggedOut, isAdmin: Boolean(user?.is_admin), isVerified: true }
}

function Location() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname + location.search}</p>
}

function renderAt(path, value) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/connexion" element={<p>Page de connexion</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/espace/profil" element={<p>Page profil</p>} />
            <Route path="/espace/reservations" element={<p>Page réservations</p>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Tableau de bord admin</p>} />
          </Route>
        </Routes>
        <Location />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('shows a skeleton, not the page, while the user loads', () => {
    renderAt('/espace/profil', auth('loading'))
    expect(screen.getByRole('status')).toHaveTextContent('Chargement de votre espace…')
    expect(screen.queryByText('Page profil')).not.toBeInTheDocument()
  })

  it('sends guests to the login page with the page to come back to', () => {
    renderAt('/espace/reservations', auth('guest'))
    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/connexion?redirect=%2Fespace%2Freservations',
    )
  })

  it('sends a user who just logged out home, not to the login page', () => {
    renderAt('/espace/profil', auth('guest', null, { loggedOut: true }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })

  it('renders the page for signed-in users', () => {
    renderAt('/espace/profil', auth('authenticated', CLIENT))
    expect(screen.getByText('Page profil')).toBeInTheDocument()
  })
})

describe('GuestRoute', () => {
  it('renders the login page for guests', () => {
    renderAt('/connexion', auth('guest'))
    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
  })

  it('sends a signed-in client to the redirect parameter', () => {
    renderAt('/connexion?redirect=%2Fespace%2Freservations', auth('authenticated', CLIENT))
    expect(screen.getByText('Page réservations')).toBeInTheDocument()
  })

  it('ignores an external redirect and falls back to the profile', () => {
    renderAt('/connexion?redirect=%2F%2Fevil.example', auth('authenticated', CLIENT))
    expect(screen.getByText('Page profil')).toBeInTheDocument()
  })

  it('sends a signed-in admin to the admin area', () => {
    renderAt('/connexion?redirect=%2Fespace%2Fprofil', auth('authenticated', ADMIN))
    expect(screen.getByText('Tableau de bord admin')).toBeInTheDocument()
  })
})

describe('AdminRoute', () => {
  it('shows the French 403 page to clients', () => {
    renderAt('/admin', auth('authenticated', CLIENT))
    expect(screen.getByRole('heading', { name: 'Accès réservé à l’agence' })).toBeInTheDocument()
    expect(screen.queryByText('Tableau de bord admin')).not.toBeInTheDocument()
  })

  it('renders the admin area for admins', () => {
    renderAt('/admin', auth('authenticated', ADMIN))
    expect(screen.getByText('Tableau de bord admin')).toBeInTheDocument()
  })

  it('sends guests to the login page', () => {
    renderAt('/admin', auth('guest'))
    expect(screen.getByTestId('location')).toHaveTextContent('/connexion?redirect=%2Fadmin')
  })

  it('shows the admin skeleton while the user loads', () => {
    renderAt('/admin', auth('loading'))
    expect(screen.getByRole('status')).toHaveTextContent('Chargement de l’administration…')
  })
})

describe('guards inside a page transition', () => {
  function Harness() {
    const [value, setValue] = useState(auth('authenticated', CLIENT))
    const navigate = useNavigate()
    return (
      <AuthContext.Provider value={value}>
        <button
          onClick={() => {
            // The user leaves the page, and the session expires (401) while the
            // profile page is still animating out.
            navigate('/')
            setTimeout(() => setValue(auth('guest')), 30)
          }}
        >
          Aller à l’accueil
        </button>
        <Routes>
          <Route element={<PageTransition />}>
            <Route index element={<p>Accueil</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/espace/profil" element={<p>Page profil</p>} />
            </Route>
          </Route>
        </Routes>
        <Location />
      </AuthContext.Provider>
    )
  }

  it('does not redirect from the leaving page when the session ends meanwhile', async () => {
    render(
      <MemoryRouter initialEntries={['/espace/profil']}>
        <Harness />
      </MemoryRouter>,
    )
    expect(screen.getByText('Page profil')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Aller à l’accueil' }))

    expect(await screen.findByText('Accueil')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Page profil')).not.toBeInTheDocument())
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })
})
