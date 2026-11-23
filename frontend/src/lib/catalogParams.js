/*
 * Catalogue filters <-> URL query string. The URL is the single source of truth:
 * every filter, the sort and the page live in it, so links can be shared and the
 * back button restores the previous search.
 *
 *   /voitures?category=suv,luxe&transmission=automatic&price_max=800&sort=price_desc&page=2
 *
 * Parameter names are the API's (GET /api/cars), except `favoris=1`, which the SPA
 * turns into the list of favorite slugs.
 */

import { toInputDate } from './dates.js'

export const DEFAULT_SORT = 'price_asc'

export const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Les plus récentes' },
  { value: 'popular', label: 'Les plus louées' },
]

/** Every filter at its default value: an empty URL. */
export const EMPTY_FILTERS = Object.freeze({
  category: [],
  brand: [],
  fuel: [],
  transmission: '',
  location: '',
  q: '',
  start_at: '',
  end_at: '',
  seats_min: null,
  price_min: null,
  price_max: null,
  air_conditioning: false,
  favorites: false,
  sort: DEFAULT_SORT,
  page: 1,
})

const LIST_KEYS = ['category', 'brand', 'fuel']
const TEXT_KEYS = ['transmission', 'location', 'q']
const NUMBER_KEYS = ['seats_min', 'price_min', 'price_max']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Order of the parameters in the URL, so equal filters always give the same URL. */
const URL_ORDER = [
  'q',
  'location',
  'start_at',
  'end_at',
  'category',
  'brand',
  'transmission',
  'fuel',
  'seats_min',
  'price_min',
  'price_max',
  'air_conditioning',
  'favoris',
  'sort',
  'page',
]

function parseList(value) {
  if (!value) return []
  return [...new Set(value.split(',').map((item) => item.trim()))].filter(Boolean)
}

function parseNumber(value) {
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

/**
 * URLSearchParams -> filters object. Invalid values fall back to their default
 * (the API would reject them anyway), so a hand-edited URL never breaks the page.
 * Dates already in the past (an old shared link) are dropped.
 * @param {URLSearchParams|string} searchParams
 * @param {string} today "YYYY-MM-DD"
 */
export function parseCatalogParams(searchParams, today = toInputDate(new Date())) {
  const params =
    searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams)
  const filters = { ...EMPTY_FILTERS }

  for (const key of LIST_KEYS) filters[key] = parseList(params.get(key))
  for (const key of TEXT_KEYS) filters[key] = params.get(key)?.trim() ?? ''
  for (const key of NUMBER_KEYS) filters[key] = parseNumber(params.get(key))

  const start = params.get('start_at') ?? ''
  const end = params.get('end_at') ?? ''
  if (DATE_PATTERN.test(start) && DATE_PATTERN.test(end) && end > start && start >= today) {
    filters.start_at = start
    filters.end_at = end
  }

  filters.air_conditioning = params.get('air_conditioning') === '1'
  filters.favorites = params.get('favoris') === '1'

  const sort = params.get('sort')
  filters.sort = SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT

  const page = Number.parseInt(params.get('page') ?? '', 10)
  filters.page = Number.isInteger(page) && page > 1 ? page : 1

  return filters
}

/** Filters -> `{ key: value }` of the non-default values, with URL names. */
function toEntries(filters) {
  const entries = {}
  for (const key of LIST_KEYS) if (filters[key]?.length) entries[key] = filters[key].join(',')
  for (const key of TEXT_KEYS) if (filters[key]) entries[key] = filters[key]
  for (const key of NUMBER_KEYS)
    if (filters[key] !== null && filters[key] !== undefined) entries[key] = String(filters[key])
  if (filters.start_at && filters.end_at) {
    entries.start_at = filters.start_at
    entries.end_at = filters.end_at
  }
  if (filters.air_conditioning) entries.air_conditioning = '1'
  if (filters.favorites) entries.favoris = '1'
  if (filters.sort && filters.sort !== DEFAULT_SORT) entries.sort = filters.sort
  if (filters.page > 1) entries.page = String(filters.page)
  return entries
}

/**
 * Filters -> "?category=suv,luxe&page=2" (empty string without filters). Commas stay
 * readable; every value is encoded otherwise.
 */
export function toQueryString(filters) {
  const entries = toEntries(filters)
  const parts = URL_ORDER.filter((key) => key in entries).map(
    (key) => `${key}=${entries[key].split(',').map(encodeURIComponent).join(',')}`,
  )
  return parts.length ? `?${parts.join('&')}` : ''
}

/**
 * Apply a change. Any filter change goes back to page 1 (page 4 of the old results
 * means nothing for the new ones), unless the change is the page itself.
 */
export function applyFilterChange(filters, patch) {
  return { ...filters, ...patch, page: 'page' in patch ? patch.page : 1 }
}

/** Query parameters for GET /api/cars. Favorites become the `slug` list. */
export function toApiParams(filters, favoriteSlugs = []) {
  const { favoris, ...entries } = toEntries(filters)
  if (favoris) entries.slug = favoriteSlugs.join(',')
  return entries
}

/** Number of filters set in the panel (badge of the "Filtres" button on mobile). */
export function countPanelFilters(filters) {
  return (
    filters.brand.length +
    filters.fuel.length +
    (filters.transmission ? 1 : 0) +
    (filters.seats_min ? 1 : 0) +
    (filters.price_min !== null || filters.price_max !== null ? 1 : 0) +
    (filters.air_conditioning ? 1 : 0)
  )
}

/** True when anything narrows the results (the sort and the page do not). */
export function hasActiveFilters(filters) {
  return Object.keys(EMPTY_FILTERS).some(
    (key) =>
      key !== 'sort' &&
      key !== 'page' &&
      JSON.stringify(filters[key]) !== JSON.stringify(EMPTY_FILTERS[key]),
  )
}
