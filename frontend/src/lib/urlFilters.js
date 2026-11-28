/*
 * Filters of a back-office list <-> URL query string. Like the catalogue
 * (lib/catalogParams.js), the URL is the only source of truth: filters, sort and page
 * live in it, so a filtered list can be shared and the back button restores it.
 *
 * A schema lists the parameters, in URL order:
 *   { onglet: { type: 'enum', values: ['pending', 'all'], default: 'pending', apiKey: 'tab' },
 *     status: { type: 'list' }, q: { type: 'string' }, page: { type: 'page' } }
 *
 * Types: string, enum (one of `values`), list (comma separated, optionally limited to
 * `values`), date (YYYY-MM-DD), id (positive integer as a string), page (≥ 1).
 * `apiKey` names the API parameter when it differs from the URL one (the tab is
 * `?onglet=` in the SPA's URLs and `tab` in the API).
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function emptyValue(rule) {
  if (rule.default !== undefined) return rule.default
  if (rule.type === 'list') return []
  if (rule.type === 'page') return 1
  return ''
}

function parseValue(rule, raw) {
  if (raw === null || raw === undefined || raw === '') return emptyValue(rule)
  const value = String(raw).trim()

  switch (rule.type) {
    case 'enum':
      return rule.values.includes(value) ? value : emptyValue(rule)
    case 'list': {
      const items = [...new Set(value.split(',').map((item) => item.trim()))].filter(Boolean)
      return rule.values ? items.filter((item) => rule.values.includes(item)) : items
    }
    case 'date':
      return DATE_PATTERN.test(value) ? value : emptyValue(rule)
    case 'id':
      return /^[1-9]\d*$/.test(value) ? value : emptyValue(rule)
    case 'page': {
      const page = Number.parseInt(value, 10)
      return Number.isInteger(page) && page > 1 ? page : 1
    }
    default:
      return value
  }
}

function isEmpty(rule, value) {
  if (rule.type === 'list') return !value?.length
  if (value === null || value === undefined || value === '') return true
  return value === emptyValue(rule)
}

/** URLSearchParams | string -> filters object (invalid values fall back to their default). */
export function parseFilters(search, schema) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search)
  return Object.fromEntries(
    Object.entries(schema).map(([key, rule]) => [key, parseValue(rule, params.get(key))]),
  )
}

/** Filters -> "?onglet=all&status=confirmed,active" (empty string when everything is default). */
export function filtersToSearch(filters, schema) {
  const parts = Object.entries(schema)
    .filter(([key, rule]) => !isEmpty(rule, filters[key]))
    .map(([key, rule]) => {
      const value = rule.type === 'list' ? filters[key].join(',') : String(filters[key])
      return `${key}=${value.split(',').map(encodeURIComponent).join(',')}`
    })
  return parts.length ? `?${parts.join('&')}` : ''
}

/** Any change goes back to page 1, unless the change is the page itself. */
export function applyFilterPatch(filters, patch) {
  return { ...filters, ...patch, page: 'page' in patch ? patch.page : 1 }
}

/** Query parameters for the API: every non-empty value (defaults included), lists joined. */
export function filtersToApiParams(filters, schema) {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => {
        const value = filters[key]
        return Array.isArray(value) ? value.length > 0 : value !== '' && value !== null
      })
      .map(([key, rule]) => [
        rule.apiKey ?? key,
        rule.type === 'list' ? filters[key].join(',') : filters[key],
      ]),
  )
}

/** Number of filters that differ from their default, `ignore` excluded (onglet, sort, page…). */
export function countActiveFilters(filters, schema, ignore = []) {
  return Object.entries(schema).filter(
    ([key, rule]) => !ignore.includes(key) && !isEmpty(rule, filters[key]),
  ).length
}
