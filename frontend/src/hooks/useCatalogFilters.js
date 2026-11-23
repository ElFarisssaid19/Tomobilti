import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { applyFilterChange, parseCatalogParams, toQueryString } from '../lib/catalogParams.js'

/**
 * Catalogue filters stored in the URL (see lib/catalogParams.js). Each change pushes a
 * history entry, so the back button restores the previous filters; pass
 * `{ replace: true }` for changes that should not (typing in the search field).
 *
 * @example
 * const { filters, setFilters, resetFilters } = useCatalogFilters()
 * setFilters({ transmission: 'automatic' }) // back to page 1
 * setFilters({ page: 2 })
 */
export default function useCatalogFilters() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const filters = useMemo(() => parseCatalogParams(search), [search])

  const setFilters = useCallback(
    (patch, { replace = false } = {}) => {
      const next = applyFilterChange(filters, patch)
      navigate({ search: toQueryString(next) }, { replace, preventScrollReset: true })
    },
    [filters, navigate],
  )

  const resetFilters = useCallback(() => {
    navigate({ search: '' }, { preventScrollReset: true })
  }, [navigate])

  return { filters, setFilters, resetFilters }
}
