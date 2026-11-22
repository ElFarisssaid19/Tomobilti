import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button.jsx'

describe('Button', () => {
  it('is disabled and busy while loading, and keeps its label for the width', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Confirmer la réservation
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Confirmer la réservation' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders a router link with `to`', () => {
    render(
      <MemoryRouter>
        <Button to="/voitures">Voir les voitures</Button>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Voir les voitures' })).toHaveAttribute(
      'href',
      '/voitures',
    )
  })

  it('uses aria-label as the name of an icon-only button', () => {
    const Icon = (props) => <svg {...props} />
    render(<Button iconOnly leftIcon={Icon} aria-label="Ajouter aux favoris" />)
    expect(screen.getByRole('button', { name: 'Ajouter aux favoris' })).toBeInTheDocument()
  })
})
