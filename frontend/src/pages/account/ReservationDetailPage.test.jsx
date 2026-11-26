import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelReservation, downloadVoucher, fetchReservation } from '../../api/reservations.js'
import ReservationDetailPage from './ReservationDetailPage.jsx'

vi.mock('../../api/reservations.js', () => ({
  fetchReservation: vi.fn(),
  cancelReservation: vi.fn(),
  downloadVoucher: vi.fn(),
  downloadInvoice: vi.fn(),
}))

const AGENCY = {
  slug: 'marrakech-gueliz',
  name: 'Marrakech Guéliz',
  address: '112, Avenue Mohammed V, Guéliz, 40000 Marrakech',
  phone: '+212524000102',
  opening_hours: 'Lun – Sam, 08:30 – 19:30',
}

function reservation(overrides = {}) {
  return {
    reference: 'TMB-2026-000123',
    status: 'pending',
    start_at: '2026-12-10T10:00:00+00:00',
    end_at: '2026-12-13T10:00:00+00:00',
    days: 3,
    total: '900.00',
    deposit_amount: '5000.00',
    car: {
      slug: 'clio',
      name: 'Renault Clio 5',
      brand: { name: 'Renault' },
      model: 'Clio 5',
      year: 2024,
      seats: 5,
      transmission: 'manual',
      fuel: 'diesel',
      images: [],
    },
    pickup_location: AGENCY,
    return_location: AGENCY,
    pricing: {
      days: 3,
      price_per_day: '300.00',
      car_total: '900.00',
      extras: [],
      extras_total: '0.00',
      fees: [],
      fees_total: '0.00',
      total: '900.00',
      deposit_amount: '5000.00',
    },
    customer_notes: null,
    rejection_reason: null,
    cancellation_reason: null,
    timeline: {
      created_at: '2026-12-01T09:00:00+00:00',
      confirmed_at: null,
      picked_up_at: null,
      returned_at: null,
      cancelled_at: null,
      rejected_at: null,
    },
    cancellation: { allowed: true, reason: null, free_until: '2026-12-09T10:00:00+00:00' },
    has_voucher: false,
    invoice: null,
    ...overrides,
  }
}

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [{ path: '/espace/reservations/:reference', element: <ReservationDetailPage /> }],
    { initialEntries: ['/espace/reservations/TMB-2026-000123'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ReservationDetailPage', () => {
  beforeEach(() => {
    fetchReservation.mockResolvedValue(reservation())
  })

  it('cancels after confirming in the dialog, with the optional reason', async () => {
    const user = userEvent.setup()
    cancelReservation.mockResolvedValue({
      reservation: reservation({
        status: 'cancelled',
        cancellation_reason: 'Vol annulé',
        timeline: { ...reservation().timeline, cancelled_at: '2026-12-02T09:00:00+00:00' },
        cancellation: { allowed: false, reason: 'Déjà annulée.', free_until: null },
      }),
      message: 'Réservation annulée.',
    })
    renderDetail()

    await user.click(await screen.findByRole('button', { name: 'Annuler la réservation' }))
    const dialog = await screen.findByRole('dialog', { name: 'Annuler cette réservation ?' })
    await user.type(within(dialog).getByLabelText('Motif (facultatif)'), 'Vol annulé')
    await user.click(within(dialog).getByRole('button', { name: 'Annuler la réservation' }))

    expect(cancelReservation).toHaveBeenCalledWith('TMB-2026-000123', 'Vol annulé')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText(/«.Vol annulé.»/)).toBeInTheDocument()
    expect(screen.getAllByText('Annulée').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Annuler la réservation' })).not.toBeInTheDocument()
  })

  it('"Garder ma réservation" closes the dialog without cancelling', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(await screen.findByRole('button', { name: 'Annuler la réservation' }))
    await user.click(await screen.findByRole('button', { name: 'Garder ma réservation' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(cancelReservation).not.toHaveBeenCalled()
  })

  it('explains why a reservation can no longer be cancelled online', async () => {
    fetchReservation.mockResolvedValue(
      reservation({
        status: 'confirmed',
        cancellation: {
          allowed: false,
          reason:
            'L’annulation gratuite n’est possible que jusqu’à 24 heures avant la prise en charge.',
          free_until: '2026-12-09T10:00:00+00:00',
        },
      }),
    )
    renderDetail()

    expect(
      await screen.findByText(
        'L’annulation gratuite n’est possible que jusqu’à 24 heures avant la prise en charge.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Annuler la réservation' })).not.toBeInTheDocument()
  })

  it.each([
    ['pending', false, null, []],
    ['confirmed', true, null, ['Télécharger le bon de réservation']],
    [
      'active',
      true,
      { number: 'FAC-2026-000045', status: 'unpaid' },
      ['Télécharger le bon de réservation', 'Télécharger la facture'],
    ],
    ['cancelled', false, null, []],
    ['rejected', false, null, []],
  ])(
    'a %s reservation offers its documents when they exist',
    async (status, hasVoucher, invoice, expected) => {
      fetchReservation.mockResolvedValue(reservation({ status, has_voucher: hasVoucher, invoice }))
      renderDetail()

      await screen.findByText('Suivi')
      const downloads = screen
        .queryAllByRole('button')
        .map((button) => button.textContent)
        .filter((name) => name.startsWith('Télécharger'))
      expect(downloads).toEqual(expected)
    },
  )

  it('downloads the voucher PDF', async () => {
    const user = userEvent.setup()
    URL.createObjectURL = vi.fn(() => 'blob:voucher')
    URL.revokeObjectURL = vi.fn()
    const save = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadVoucher.mockResolvedValue({
      blob: new Blob(['%PDF'], { type: 'application/pdf' }),
      filename: 'bon-de-reservation-TMB-2026-000123.pdf',
    })
    fetchReservation.mockResolvedValue(reservation({ status: 'confirmed', has_voucher: true }))
    renderDetail()

    await user.click(
      await screen.findByRole('button', { name: 'Télécharger le bon de réservation' }),
    )

    await waitFor(() => expect(downloadVoucher).toHaveBeenCalledWith('TMB-2026-000123'))
    await waitFor(() => expect(save).toHaveBeenCalled())
    save.mockRestore()
  })
})
