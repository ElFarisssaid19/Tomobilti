import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCars, fetchCatalogFilters, fetchLocations } from '../../api/catalog.js'
import CatalogPage from './CatalogPage.jsx'

vi.mock('../../api/catalog.js', () => ({
  fetchCars: vi.fn(),
  fetchCatalogFilters: vi.fn(),
  fetchLocations: vi.fn(),
}))

const OPTIONS = {
  categories: [{ name: 'SUV', slug: 'suv', icon: 'mountain', cars_count: 6 }],
  brands: [{ name: 'Dacia', slug: 'dacia', cars_count: 6 }],
  locations: [],
  transmissions: [
    { value: 'manual', label: 'Manuelle' },
    { value: 'automatic', label: 'Automatique' },
  ],
  fuels: [{ value: 'diesel', label: 'Diesel' }],
  seats: [4, 5, 7],
  price: { min: 230, max: 1800 },
}

const EMPTY_PAGE = { data: [], meta: { current_page: 1, last_page: 1, total: 0 } }

function LocationProbe() {
  return <output data-testid="search">{useLocation().search}</output>
}

function renderCatalog(url) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      {
        path: '/voitures',
        element: (
          <>
            <CatalogPage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [url] },
  )
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('CatalogPage', () => {
  beforeEach(() => {
    fetchCatalogFilters.mockResolvedValue(OPTIONS)
    fetchLocations.mockResolvedValue([])
    fetchCars.mockResolvedValue(EMPTY_PAGE)
  })

  it('sends the URL filters to the API and shows the empty state when nothing matches', async () => {
    renderCatalog('/voitures?category=suv&transmission=automatic&price_max=300')

    expect(
      await screen.findByRole('heading', {
        name: 'Aucune voiture ne correspond à votre recherche',
      }),
    ).toBeInTheDocument()
    expect(fetchCars).toHaveBeenCalledWith(
      { category: 'suv', transmission: 'automatic', price_max: '300' },
      expect.anything(),
    )
    expect(screen.getByRole('heading', { name: 'Aucune voiture' })).toBeInTheDocument()
  })

  it('"Réinitialiser les filtres" clears the URL and searches again', async () => {
    renderCatalog('/voitures?category=suv&transmission=automatic')

    await userEvent.click(await screen.findByRole('button', { name: 'Réinitialiser les filtres' }))

    expect(screen.getByTestId('search')).toHaveTextContent(/^$/)
    expect(fetchCars).toHaveBeenLastCalledWith({}, expect.anything())
    const categories = screen.getByRole('group', { name: 'Catégories' })
    expect(within(categories).getByRole('button', { name: 'Toutes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows the favorites empty state without calling the API', async () => {
    renderCatalog('/voitures?favoris=1')

    expect(
      await screen.findByRole('heading', { name: 'Aucun favori pour l’instant' }),
    ).toBeInTheDocument()
    expect(fetchCars).not.toHaveBeenCalled()
  })
})
