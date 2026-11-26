import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { runReservationAction } from '../../api/admin.js'
import { actionsForStatus } from '../../lib/adminReservations.js'
import ReservationActions from './ReservationActions.jsx'

vi.mock('../../api/admin.js', () => ({ runReservationAction: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderActions(status) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <ReservationActions reservation={{ reference: 'TMB-2026-000042', status }} />
    </QueryClientProvider>,
  )
}

const buttonNames = () => screen.queryAllByRole('button').map((button) => button.textContent)

describe('actionsForStatus', () => {
  it('mirrors the allowed transitions of the server', () => {
    expect(actionsForStatus('pending')).toEqual(['confirm', 'reject', 'cancel'])
    expect(actionsForStatus('confirmed')).toEqual(['pickUp', 'cancel'])
    expect(actionsForStatus('active')).toEqual(['return'])
    expect(actionsForStatus('completed')).toEqual([])
    expect(actionsForStatus('cancelled')).toEqual([])
    expect(actionsForStatus('rejected')).toEqual([])
  })
})

describe('ReservationActions', () => {
  it.each([
    ['pending', ['Confirmer', 'Refuser', 'Annuler']],
    ['confirmed', ['Marquer comme récupérée', 'Annuler']],
    ['active', ['Marquer comme rendue']],
    ['completed', []],
    ['rejected', []],
  ])('shows the actions allowed for a %s reservation', (status, expected) => {
    renderActions(status)
    expect(buttonNames()).toEqual(expected)
  })

  it('confirms after the confirmation dialog', async () => {
    const user = userEvent.setup()
    runReservationAction.mockResolvedValue({
      reservation: { reference: 'TMB-2026-000042', status: 'confirmed' },
      message: 'Réservation confirmée.',
    })
    renderActions('pending')

    await user.click(screen.getByRole('button', { name: 'Confirmer' }))
    const dialog = await screen.findByRole('dialog', { name: 'Confirmer cette réservation ?' })
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }))

    await waitFor(() =>
      expect(runReservationAction).toHaveBeenCalledWith('TMB-2026-000042', 'confirm', undefined),
    )
  })

  it('requires a reason before refusing, then sends it', async () => {
    const user = userEvent.setup()
    runReservationAction.mockResolvedValue({
      reservation: { reference: 'TMB-2026-000042', status: 'rejected' },
      message: 'Réservation refusée.',
    })
    renderActions('pending')

    await user.click(screen.getByRole('button', { name: 'Refuser' }))
    const dialog = await screen.findByRole('dialog', { name: 'Refuser cette demande ?' })
    await user.click(within(dialog).getByRole('button', { name: 'Refuser' }))

    expect(
      await within(dialog).findByText('Indiquez le motif : il sera affiché au client.'),
    ).toBeInTheDocument()
    const reason = within(dialog).getByRole('textbox', { name: /Motif du refus/ })
    expect(reason).toHaveAttribute('aria-invalid', 'true')
    expect(runReservationAction).not.toHaveBeenCalled()

    await user.type(reason, '  Permis de moins de 2 ans.  ')
    await user.click(within(dialog).getByRole('button', { name: 'Refuser' }))

    await waitFor(() =>
      expect(runReservationAction).toHaveBeenCalledWith('TMB-2026-000042', 'reject', {
        reason: 'Permis de moins de 2 ans.',
      }),
    )
  })

  it('shows the server error under the reason field', async () => {
    const user = userEvent.setup()
    runReservationAction.mockRejectedValue({
      response: {
        status: 422,
        data: { message: 'Erreur', errors: { reason: ['Le motif est trop long.'] } },
      },
    })
    renderActions('confirmed')

    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    const dialog = await screen.findByRole('dialog', { name: 'Annuler cette réservation ?' })
    await user.type(
      within(dialog).getByRole('textbox', { name: /Motif de l’annulation/ }),
      'Panne du véhicule',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Annuler la réservation' }))

    expect(await within(dialog).findByText('Le motif est trop long.')).toBeInTheDocument()
  })

  it('asks how the client pays before marking the car as picked up', async () => {
    const user = userEvent.setup()
    runReservationAction.mockResolvedValue({
      reservation: { reference: 'TMB-2026-000042', status: 'active' },
      message: 'Réservation marquée comme récupérée.',
    })
    renderActions('confirmed')

    await user.click(screen.getByRole('button', { name: 'Marquer comme récupérée' }))
    const dialog = await screen.findByRole('dialog', { name: 'Le client a récupéré la voiture ?' })
    await user.click(within(dialog).getByRole('button', { name: 'Marquer comme récupérée' }))

    expect(await within(dialog).findByText('Choisissez le mode de paiement.')).toBeInTheDocument()
    expect(runReservationAction).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('radio', { name: 'Carte bancaire' }))
    await user.click(within(dialog).getByRole('radio', { name: /Plus tard/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Marquer comme récupérée' }))

    await waitFor(() =>
      expect(runReservationAction).toHaveBeenCalledWith('TMB-2026-000042', 'pickUp', {
        payment_method: 'card',
        paid: false,
      }),
    )
  })

  it('sends "paid now" by default', async () => {
    const user = userEvent.setup()
    runReservationAction.mockResolvedValue({
      reservation: { reference: 'TMB-2026-000042', status: 'active' },
      message: 'Réservation marquée comme récupérée.',
    })
    renderActions('confirmed')

    await user.click(screen.getByRole('button', { name: 'Marquer comme récupérée' }))
    const dialog = await screen.findByRole('dialog', { name: 'Le client a récupéré la voiture ?' })
    await user.click(within(dialog).getByRole('radio', { name: 'Espèces' }))
    await user.click(within(dialog).getByRole('button', { name: 'Marquer comme récupérée' }))

    await waitFor(() =>
      expect(runReservationAction).toHaveBeenCalledWith('TMB-2026-000042', 'pickUp', {
        payment_method: 'cash',
        paid: true,
      }),
    )
  })
})
