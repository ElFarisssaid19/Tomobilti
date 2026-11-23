import { act, renderHook } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useCatalogFilters from './useCatalogFilters.js'

/** Runs the hook on a real (memory) router, so history works like in the browser. */
function renderOnRouter(initialEntry) {
  const result = { current: null }
  function Probe() {
    result.current = { ...useCatalogFilters(), location: useLocation(), navigate: useNavigate() }
    return null
  }
  const router = createMemoryRouter([{ path: '/voitures', element: <Probe /> }], {
    initialEntries: [initialEntry],
  })
  renderHook(() => null, { wrapper: () => <RouterProvider router={router} /> })
  return result
}

describe('useCatalogFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-12-01T10:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('reads the filters from the URL', () => {
    const hook = renderOnRouter('/voitures?category=suv&transmission=automatic&page=2')

    expect(hook.current.filters.category).toEqual(['suv'])
    expect(hook.current.filters.transmission).toBe('automatic')
    expect(hook.current.filters.page).toBe(2)
  })

  it('writes each change to the URL and goes back to page 1', async () => {
    const hook = renderOnRouter('/voitures?category=suv&page=3')

    await act(async () => hook.current.setFilters({ transmission: 'automatic', price_max: 800 }))

    expect(hook.current.location.search).toBe('?category=suv&transmission=automatic&price_max=800')
    expect(hook.current.filters.page).toBe(1)
  })

  it('restores the previous filters with the back button', async () => {
    const hook = renderOnRouter('/voitures')

    await act(async () => hook.current.setFilters({ category: ['suv'] }))
    await act(async () => hook.current.setFilters({ transmission: 'automatic' }))
    await act(async () => hook.current.setFilters({ sort: 'price_desc' }))
    await act(async () => hook.current.setFilters({ page: 2 }))
    expect(hook.current.location.search).toBe(
      '?category=suv&transmission=automatic&sort=price_desc&page=2',
    )

    await act(async () => hook.current.navigate(-1))

    expect(hook.current.filters).toMatchObject({
      category: ['suv'],
      transmission: 'automatic',
      sort: 'price_desc',
      page: 1,
    })
  })

  it('can replace the history entry and reset everything', async () => {
    const hook = renderOnRouter('/voitures?brand=dacia')

    await act(async () => hook.current.resetFilters())

    expect(hook.current.location.search).toBe('')
    expect(hook.current.filters.brand).toEqual([])
  })
})
