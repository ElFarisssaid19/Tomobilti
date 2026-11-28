import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { RESERVATION_FILTERS } from '../lib/adminReservations.js'
import { filtersToApiParams, filtersToSearch, parseFilters } from '../lib/urlFilters.js'
import RootLayout from '../layouts/RootLayout.jsx'
import useUrlFilters from './useUrlFilters.js'

describe('urlFilters', () => {
  it('parses the URL, dropping invalid values', () => {
    const filters = parseFilters(
      '?onglet=all&status=confirmed,nope,active&from=2026-12-01&to=31/12&car=abc&page=3',
      RESERVATION_FILTERS,
    )
    expect(filters).toMatchObject({
      onglet: 'all',
      status: ['confirmed', 'active'],
      from: '2026-12-01',
      to: '',
      car: '',
      page: 3,
    })
    expect(parseFilters('', RESERVATION_FILTERS)).toMatchObject({
      onglet: 'pending',
      status: [],
      page: 1,
    })
  })

  it('writes only what differs from the defaults, in schema order (the API names the tab "tab")', () => {
    const filters = {
      ...parseFilters('', RESERVATION_FILTERS),
      q: 'bennani',
      status: ['confirmed'],
      page: 2,
    }
    expect(filtersToSearch(filters, RESERVATION_FILTERS)).toBe('?status=confirmed&q=bennani&page=2')
    expect(filtersToApiParams(filters, RESERVATION_FILTERS)).toEqual({
      tab: 'pending',
      status: 'confirmed',
      q: 'bennani',
      page: 2,
    })
  })
})

function Probe() {
  const { filters, setFilters } = useUrlFilters(RESERVATION_FILTERS)
  return (
    <div>
      <p data-testid="filters">
        {JSON.stringify({ onglet: filters.onglet, status: filters.status, page: filters.page })}
      </p>
      <button type="button" onClick={() => setFilters({ status: ['active'] })}>
        Filtrer
      </button>
      <button type="button" onClick={() => setFilters({ page: 2 })}>
        Page 2
      </button>
    </div>
  )
}

describe('useUrlFilters', () => {
  it('sends old ?tab= links to ?onglet=, keeping the other parameters', () => {
    const router = createMemoryRouter(
      [
        {
          element: <RootLayout />,
          children: [{ path: '/admin/reservations', element: <Probe /> }],
        },
      ],
      { initialEntries: ['/admin/reservations?tab=all&status=active'] },
    )
    render(<RouterProvider router={router} />)

    expect(router.state.location.search).toBe('?status=active&onglet=all')
    expect(router.state.historyAction).toBe('REPLACE')
    expect(screen.getByTestId('filters')).toHaveTextContent(
      '{"onglet":"all","status":["active"],"page":1}',
    )
  })

  it('keeps the filters in the URL and goes back to page 1 when one changes', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter([{ path: '/admin/reservations', element: <Probe /> }], {
      initialEntries: ['/admin/reservations?onglet=all&page=3'],
    })
    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('filters')).toHaveTextContent('{"onglet":"all","status":[],"page":3}')

    await user.click(screen.getByRole('button', { name: 'Filtrer' }))
    expect(router.state.location.search).toBe('?onglet=all&status=active')
    expect(screen.getByTestId('filters')).toHaveTextContent(
      '{"onglet":"all","status":["active"],"page":1}',
    )

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(router.state.location.search).toBe('?onglet=all&status=active&page=2')

    await act(() => router.navigate(-1))
    expect(screen.getByTestId('filters')).toHaveTextContent('"page":1')
  })
})
