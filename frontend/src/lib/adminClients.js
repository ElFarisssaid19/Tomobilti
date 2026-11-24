/** URL parameters of /admin/clients (same names as GET /api/admin/clients). */
export const CLIENT_FILTERS = Object.freeze({
  q: { type: 'string' },
  active: { type: 'enum', values: ['1', '0'] },
  verified: { type: 'enum', values: ['1', '0'] },
  sort: {
    type: 'enum',
    values: ['name', 'created_at', 'reservations_count', 'reservations_sum_total'],
  },
  direction: { type: 'enum', values: ['asc', 'desc'] },
  page: { type: 'page' },
})
