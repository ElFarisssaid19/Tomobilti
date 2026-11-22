import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../context/authContext.js'
import LoginPage from './LoginPage.jsx'

function apiError(status, data) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, data } })
}

function renderLogin(login) {
  render(
    <AuthContext.Provider value={{ status: 'guest', user: null, login }}>
      <MemoryRouter initialEntries={['/connexion']}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

async function submit(email, password) {
  await userEvent.type(screen.getByLabelText(/Adresse e-mail/), email)
  await userEvent.type(screen.getByLabelText(/^Mot de passe/), password)
  await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))
}

describe('LoginPage', () => {
  it('shows the Laravel 422 error under the email field', async () => {
    const message = 'Ces identifiants ne correspondent pas à nos enregistrements.'
    const login = vi
      .fn()
      .mockRejectedValue(apiError(422, { message, errors: { email: [message] } }))
    renderLogin(login)

    await submit('client@tomobilti.ma', 'mauvais-mot-de-passe')

    const email = screen.getByLabelText(/Adresse e-mail/)
    expect(login).toHaveBeenCalledWith({
      email: 'client@tomobilti.ma',
      password: 'mauvais-mot-de-passe',
      remember: false,
    })
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription(message)
  })

  it('shows the throttle message above the form', async () => {
    const message =
      'Tentatives de connexion trop nombreuses. Veuillez essayer de nouveau dans 42 secondes.'
    renderLogin(vi.fn().mockRejectedValue(apiError(429, { message, errors: { email: [message] } })))

    await submit('client@tomobilti.ma', 'x')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Trop de tentatives')
    expect(alert).toHaveTextContent(message)
  })

  it('checks the fields before calling the API', async () => {
    const login = vi.fn()
    renderLogin(login)

    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(login).not.toHaveBeenCalled()
    expect(screen.getByText('Saisissez votre adresse e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeInTheDocument()
  })

  it('toggles the password visibility', async () => {
    renderLogin(vi.fn())
    const password = screen.getByLabelText(/^Mot de passe/)
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }))
    expect(password).toHaveAttribute('type', 'text')
  })
})
