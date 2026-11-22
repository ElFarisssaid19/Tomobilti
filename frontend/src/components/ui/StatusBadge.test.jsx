import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusBadge from './StatusBadge.jsx'

describe('StatusBadge', () => {
  it.each([
    ['pending', 'En attente'],
    ['confirmed', 'Confirmée'],
    ['active', 'En cours'],
    ['completed', 'Terminée'],
    ['cancelled', 'Annulée'],
    ['rejected', 'Refusée'],
  ])('shows the French label for "%s"', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('falls back to the raw value for an unknown status', () => {
    render(<StatusBadge status="archived" />)
    expect(screen.getByText('archived')).toBeInTheDocument()
  })
})
