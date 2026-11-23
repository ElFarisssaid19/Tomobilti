import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchCar,
  fetchCarAvailability,
  fetchCars,
  fetchCatalogFilters,
  fetchCategories,
  fetchExtras,
  fetchFeaturedCars,
  fetchLocations,
} from '../api/catalog.js'
import { queryKeys } from '../api/queryKeys.js'

/** Reference data (categories, agencies, options) barely changes: keep it 10 minutes. */
const REFERENCE_STALE_TIME = 10 * 60_000

/**
 * Catalogue page. `placeholderData: keepPreviousData` keeps the current cards on screen
 * while the next filters load (`isPlaceholderData` is then true), instead of a blank grid.
 */
export function useCars(params, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.cars.list(params),
    queryFn: ({ signal }) => fetchCars(params, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFeaturedCars() {
  return useQuery({
    queryKey: queryKeys.cars.featured(),
    queryFn: ({ signal }) => fetchFeaturedCars({ signal }),
  })
}

export function useCar(slug) {
  return useQuery({
    queryKey: queryKeys.cars.detail(slug),
    queryFn: ({ signal }) => fetchCar(slug, { signal }),
    enabled: Boolean(slug),
  })
}

/** Booked days change as customers book: always refetch when the page opens. */
export function useCarAvailability(slug) {
  return useQuery({
    queryKey: queryKeys.cars.availability(slug),
    queryFn: ({ signal }) => fetchCarAvailability(slug, { signal }),
    enabled: Boolean(slug),
    staleTime: 0,
  })
}

/** Options of the filter panel (GET /api/catalog/filters). */
export function useCatalogOptions() {
  return useQuery({
    queryKey: queryKeys.catalog.filters(),
    queryFn: ({ signal }) => fetchCatalogFilters({ signal }),
    staleTime: REFERENCE_STALE_TIME,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: ({ signal }) => fetchCategories({ signal }),
    staleTime: REFERENCE_STALE_TIME,
  })
}

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations(),
    queryFn: ({ signal }) => fetchLocations({ signal }),
    staleTime: REFERENCE_STALE_TIME,
  })
}

export function useExtras() {
  return useQuery({
    queryKey: queryKeys.extras(),
    queryFn: ({ signal }) => fetchExtras({ signal }),
    staleTime: REFERENCE_STALE_TIME,
  })
}
