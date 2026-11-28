import { describe, expect, it } from 'vitest'
import {
  applyFilterChange,
  countPanelFilters,
  EMPTY_FILTERS,
  parseCatalogParams,
  toApiParams,
  toQueryString,
} from './catalogParams.js'

const TODAY = '2026-12-01'

describe('parseCatalogParams', () => {
  it('reads every filter from the query string', () => {
    const filters = parseCatalogParams(
      '?category=suv,luxe&brand=dacia&transmission=automatic&fuel=diesel,hybrid&seats_min=5&price_min=300&price_max=800&location=marrakech-gueliz&air_conditioning=1&q=duster&start_at=2026-12-20&end_at=2026-12-27&favoris=1&sort=price_desc&page=3',
      TODAY,
    )

    expect(filters).toEqual({
      category: ['suv', 'luxe'],
      brand: ['dacia'],
      fuel: ['diesel', 'hybrid'],
      transmission: 'automatic',
      location: 'marrakech-gueliz',
      q: 'duster',
      start_at: '2026-12-20',
      end_at: '2026-12-27',
      seats_min: 5,
      price_min: 300,
      price_max: 800,
      air_conditioning: true,
      favorites: true,
      sort: 'price_desc',
      page: 3,
    })
  })

  it('falls back to the defaults for invalid or incomplete values', () => {
    const filters = parseCatalogParams(
      '?sort=random&page=-2&price_min=abc&start_at=2026-12-20&category=,suv,suv,',
      TODAY,
    )

    expect(filters.sort).toBe('price_asc')
    expect(filters.page).toBe(1)
    expect(filters.price_min).toBeNull()
    expect(filters.start_at).toBe('')
    expect(filters.end_at).toBe('')
    expect(filters.category).toEqual(['suv'])
  })

  it('drops dates that are in the past or upside down', () => {
    expect(parseCatalogParams('?start_at=2026-11-20&end_at=2026-11-25', TODAY).start_at).toBe('')
    expect(parseCatalogParams('?start_at=2026-12-25&end_at=2026-12-20', TODAY).start_at).toBe('')
  })
})

describe('toQueryString', () => {
  it('writes only the non-default values, in a stable order, with readable lists', () => {
    const filters = {
      ...EMPTY_FILTERS,
      sort: 'newest',
      category: ['suv', 'luxe'],
      q: 'land cruiser',
      page: 2,
    }

    expect(toQueryString(filters)).toBe('?q=land%20cruiser&category=suv,luxe&sort=newest&page=2')
    expect(toQueryString(EMPTY_FILTERS)).toBe('')
  })

  it('round-trips with parseCatalogParams', () => {
    const query =
      '?q=dacia&location=agadir-al-massira&start_at=2026-12-20&end_at=2026-12-27&category=suv&transmission=automatic&price_max=900&favoris=1&sort=popular&page=2'

    expect(toQueryString(parseCatalogParams(query, TODAY))).toBe(query)
  })
})

describe('applyFilterChange', () => {
  it('goes back to page 1 when a filter changes, but keeps an explicit page', () => {
    const onPage3 = { ...EMPTY_FILTERS, page: 3 }

    expect(applyFilterChange(onPage3, { transmission: 'manual' }).page).toBe(1)
    expect(applyFilterChange(onPage3, { page: 4 }).page).toBe(4)
  })
})

describe('toApiParams', () => {
  it('turns the favorites switch into the slug list', () => {
    const filters = { ...EMPTY_FILTERS, favorites: true, fuel: ['diesel'] }

    expect(toApiParams(filters, ['dacia-logan-2024', 'kia-picanto-2024'])).toEqual({
      fuel: 'diesel',
      slug: 'dacia-logan-2024,kia-picanto-2024',
    })
  })
})

describe('active filters', () => {
  it('counts the panel filters and ignores the sort and the page', () => {
    const filters = {
      ...EMPTY_FILTERS,
      brand: ['dacia', 'kia'],
      price_max: 800,
      air_conditioning: true,
    }

    expect(countPanelFilters(filters)).toBe(4)
  })
})
