import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button.jsx'
import Modal from './Modal.jsx'

describe('Modal', () => {
  it('keeps the actions outside the scrolling body, capped to the viewport', () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Changer le statut"
        description="Clio 5 2024"
        footer={<Button>Changer le statut</Button>}
      >
        <p>Contenu long</p>
      </Modal>,
    )

    const heading = screen.getByRole('heading', { name: 'Changer le statut' })
    expect(screen.getByRole('dialog', { name: 'Changer le statut' })).toBeInTheDocument()
    const panel = heading.closest('.max-h-overlay')
    expect(panel).toHaveClass('flex', 'flex-col')

    const body = screen.getByText('Contenu long').closest('.overflow-y-auto')
    expect(body).not.toBeNull()
    const action = screen.getByRole('button', { name: 'Changer le statut' })
    expect(body).not.toContainElement(action)
    expect(body).not.toContainElement(heading)
  })

  it('wraps body and footer in one form when onSubmit is given', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault())
    const user = userEvent.setup()
    render(
      <Modal
        open
        onClose={() => {}}
        title="Ajouter une agence"
        onSubmit={onSubmit}
        footer={<Button type="submit">Ajouter une agence</Button>}
      >
        <input aria-label="Nom" name="name" />
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: 'Ajouter une agence' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
