import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications.js'
import { AuthContext } from '../../context/authContext.js'
import NotificationBell from './NotificationBell.jsx'

vi.mock('../../api/notifications.js', () => ({
  fetchNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

const NOW = new Date()
const minutesAgo = (minutes) => new Date(NOW.getTime() - minutes * 60_000).toISOString()

function notification(overrides) {
  return {
    id: '9b1f6c2e-0000-4000-8000-000000000001',
    type: 'reservation.confirmed',
    title: 'Réservation confirmée',
    body: 'Renault Clio, jeu. 10 déc. à 10:00',
    reference: 'TMB-2026-000123',
    url: '/espace/reservations/TMB-2026-000123',
    read_at: null,
    created_at: minutesAgo(5),
    ...overrides,
  }
}

const PAYLOAD = {
  data: [
    notification(),
    notification({
      id: '9b1f6c2e-0000-4000-8000-000000000002',
      type: 'invoice.issued',
      title: 'Facture FAC-2026-000045',
      body: 'Renault Clio, 900 DH',
      created_at: minutesAgo(180),
    }),
    notification({
      id: '9b1f6c2e-0000-4000-8000-000000000003',
      type: 'reservation.reminder',
      title: 'Prise en charge demain à 10:00',
      read_at: minutesAgo(60),
      created_at: minutesAgo(60 * 24 * 2),
    }),
  ],
  meta: { unread_count: 2, current_page: 1, last_page: 1 },
}

function renderBell({ isAdmin = false } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      { path: '/', element: <NotificationBell /> },
      { path: '/espace/reservations/:reference', element: <p>Page de la réservation</p> },
      { path: '/espace/notifications', element: <p>Toutes mes notifications</p> },
      { path: '/admin/notifications', element: <p>Notifications de l’agence</p> },
    ],
    { initialEntries: ['/'] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ isAdmin }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return router
}

describe('NotificationBell', () => {
  beforeEach(() => {
    fetchNotifications.mockResolvedValue(PAYLOAD)
  })

  it('shows the unread count on the bell', async () => {
    renderBell()

    expect(
      await screen.findByRole('button', { name: 'Notifications, 2 non lues' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
  })

  it('lists the notifications with their relative time in French', async () => {
    const user = userEvent.setup()
    renderBell()

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))
    const panel = await screen.findByRole('dialog', { name: 'Notifications' })
    const items = within(panel).getAllByRole('listitem')

    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Réservation confirmée')
    expect(items[0]).toHaveTextContent('il y a 5 min')
    expect(items[0]).toHaveTextContent('Non lue')
    expect(items[1]).toHaveTextContent('il y a 3 h')
    expect(items[2]).toHaveTextContent('avant-hier')
    expect(items[2]).not.toHaveTextContent('Non lue')
  })

  it('opens the reservation and marks the notification read', async () => {
    const user = userEvent.setup()
    markNotificationRead.mockResolvedValue({ meta: { unread_count: 1 } })
    const router = renderBell()

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))
    await user.click(await screen.findByRole('button', { name: /Réservation confirmée/ }))

    expect(markNotificationRead).toHaveBeenCalledWith('9b1f6c2e-0000-4000-8000-000000000001')
    expect(await screen.findByText('Page de la réservation')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/espace/reservations/TMB-2026-000123')
  })

  it('"Tout marquer comme lu" clears the count', async () => {
    const user = userEvent.setup()
    markAllNotificationsRead.mockResolvedValue({ meta: { unread_count: 0 } })
    renderBell()

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))
    fetchNotifications.mockResolvedValue({
      ...PAYLOAD,
      data: PAYLOAD.data.map((item) => ({ ...item, read_at: item.read_at ?? NOW.toISOString() })),
      meta: { ...PAYLOAD.meta, unread_count: 0 },
    })
    await user.click(await screen.findByRole('button', { name: 'Tout marquer comme lu' }))

    expect(markAllNotificationsRead).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByTestId('notification-count')).not.toBeInTheDocument())
    expect(
      screen.getByRole('button', { name: 'Notifications, aucune non lue' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tout marquer comme lu' })).toBeDisabled()
  })

  it('says when there is nothing yet', async () => {
    const user = userEvent.setup()
    fetchNotifications.mockResolvedValue({ data: [], meta: { unread_count: 0 } })
    renderBell()

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))

    expect(await screen.findByText('Aucune notification')).toBeInTheDocument()
  })

  it('"Voir tout" opens the notifications page of the area', async () => {
    const user = userEvent.setup()
    const router = renderBell()

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))
    await user.click(await screen.findByRole('link', { name: 'Voir tout' }))

    expect(await screen.findByText('Toutes mes notifications')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/espace/notifications')
  })

  it('"Voir tout" leads admins to the admin notifications', async () => {
    const user = userEvent.setup()
    renderBell({ isAdmin: true })

    await user.click(await screen.findByRole('button', { name: /^Notifications/ }))

    expect(await screen.findByRole('link', { name: 'Voir tout' })).toHaveAttribute(
      'href',
      '/admin/notifications',
    )
  })
})
