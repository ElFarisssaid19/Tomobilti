import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { applyFilterPatch, filtersToSearch, parseFilters } from '../lib/urlFilters.js'

/**
 * Filters of a back-office list, kept in the URL (see lib/urlFilters.js). Each change
 * pushes a history entry and goes back to page 1; pass `{ replace: true }` for changes
 * that should not (typing in a search field).
 *
 * @example
 * const { filters, setFilters, resetFilters } = useUrlFilters(RESERVATION_FILTERS)
 * setFilters({ onglet: 'all' })
 */
export default function useUrlFilters(schema) {
  const { search } = useLocation()
  const navigate = useNavigate()
  const filters = useMemo(() => parseFilters(search, schema), [search, schema])

  const setFilters = useCallback(
    (patch, { replace = false } = {}) => {
      const next = applyFilterPatch(filters, patch)
      navigate({ search: filtersToSearch(next, schema) }, { replace, preventScrollReset: true })
    },
    [filters, navigate, schema],
  )

  const resetFilters = useCallback(
    (keep = {}) => {
      navigate({ search: filtersToSearch(parseFilters(new URLSearchParams(keep), schema), schema) })
    },
    [navigate, schema],
  )

  return { filters, setFilters, resetFilters }
}
