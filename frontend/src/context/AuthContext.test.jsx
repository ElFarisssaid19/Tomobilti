import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '../api/auth.js'
import * as client from '../api/client.js'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './authContext.js'

vi.mock('../api/auth.js', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../api/client.js', () => ({
  getCsrfCookie: vi.fn(() => Promise.resolve()),
  onUnauthorized: vi.fn(() => () => {}),
}))

const CLIENT = {
  id: 1,
  name: 'Salma Bennani',
  email: 'salma@example.com',
  is_admin: false,
  email_verified_at: null,
}
const ADMIN = {
  id: 2,
  name: 'Karim Admin',
  email: 'admin@example.com',
  is_admin: true,
  email_verified_at: '2026-11-01T10:00:00+01:00',
}

function unauthorized() {
  return Object.assign(new Error('Unauthenticated'), { response: { status: 401 } })
}

function Probe() {
  const { status, user, isAdmin, isVerified, login, logout } = useAuth()
  return (
    <div>
      <p>status:{status}</p>
      <p>user:{user?.name ?? 'none'}</p>
      <p>admin:{String(isAdmin)}</p>
      <p>verified:{String(isVerified)}</p>
      <button onClick={() => login({ email: 'a@b.ma', password: 'x' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(authApi.fetchCurrentUser).mockReset()
  })

  it('starts loading, fetches the CSRF cookie, then becomes authenticated', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(CLIENT)
    renderProvider()

    expect(screen.getByText('status:loading')).toBeInTheDocument()
    expect(await screen.findByText('status:authenticated')).toBeInTheDocument()
    expect(screen.getByText('user:Salma Bennani')).toBeInTheDocument()
    expect(screen.getByText('admin:false')).toBeInTheDocument()
    expect(screen.getByText('verified:false')).toBeInTheDocument()
    expect(client.getCsrfCookie).toHaveBeenCalled()
  })

  it('becomes guest when /api/user answers 401', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(unauthorized())
    renderProvider()

    expect(await screen.findByText('status:guest')).toBeInTheDocument()
    expect(screen.getByText('user:none')).toBeInTheDocument()
  })

  it('logs in and out', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(unauthorized())
    authApi.login.mockResolvedValue(ADMIN)
    authApi.logout.mockResolvedValue()
    renderProvider()
    await screen.findByText('status:guest')

    await userEvent.click(screen.getByRole('button', { name: 'login' }))
    expect(await screen.findByText('status:authenticated')).toBeInTheDocument()
    expect(screen.getByText('admin:true')).toBeInTheDocument()
    expect(screen.getByText('verified:true')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'logout' }))
    expect(await screen.findByText('status:guest')).toBeInTheDocument()
  })

  it('clears the user when any request answers 401', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(CLIENT)
    renderProvider()
    await screen.findByText('status:authenticated')

    const handler = client.onUnauthorized.mock.calls.at(-1)[0]
    act(() => handler())

    await waitFor(() => expect(screen.getByText('status:guest')).toBeInTheDocument())
  })
})
