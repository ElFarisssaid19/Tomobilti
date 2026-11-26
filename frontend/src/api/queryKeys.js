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
  bookingRules: () => ['booking-rules'],
  notifications: () => ['notifications'],
  reservations: {
    all: ['reservations'],
    list: (params) => ['reservations', 'list', params],
    detail: (reference) => ['reservations', 'detail', reference],
    quote: (payload) => ['reservations', 'quote', payload],
  },
  /* Back office: every admin query starts with 'admin', so they can be refreshed together. */
  admin: {
    all: ['admin'],
    dashboard: (period) => ['admin', 'dashboard', period],
    reservations: {
      all: ['admin', 'reservations'],
      list: (params) => ['admin', 'reservations', 'list', params],
      detail: (reference) => ['admin', 'reservations', 'detail', reference],
      pendingCount: () => ['admin', 'reservations', 'pending-count'],
    },
    planning: (params) => ['admin', 'planning', params],
    invoices: {
      all: ['admin', 'invoices'],
      list: (params) => ['admin', 'invoices', 'list', params],
    },
    cars: {
      all: ['admin', 'cars'],
      list: (params) => ['admin', 'cars', 'list', params],
      detail: (id) => ['admin', 'cars', 'detail', String(id)],
      conflicts: (id) => ['admin', 'cars', 'conflicts', String(id)],
    },
    clients: {
      all: ['admin', 'clients'],
      list: (params) => ['admin', 'clients', 'list', params],
      detail: (id) => ['admin', 'clients', 'detail', String(id)],
    },
    settings: (resource) => ['admin', 'settings', resource],
  },
}
