/*
 * TanStack Query keys, one factory per resource (DESIGN.md, "Data").
 * Keys go from general to specific, so `invalidateQueries({ queryKey: queryKeys.cars.all })`
 * refreshes every car query at once.
 */
export const queryKeys = {
  cars: {
    all: ['cars'],
    list: (params) => ['cars', 'list', params],
    featured: () => ['cars', 'featured'],
    detail: (slug) => ['cars', 'detail', slug],
    availability: (slug) => ['cars', 'availability', slug],
  },
  catalog: {
    filters: () => ['catalog', 'filters'],
  },
  categories: () => ['categories'],
  locations: () => ['locations'],
  extras: () => ['extras'],
}
