import api from './client.js'

/*
 * Public catalogue and website endpoints (backend/routes/api.php). No authentication.
 * Functions return the resource payload (`data`), except fetchCars and fetchCar which
 * also need `meta` (pagination) and `similar`.
 */

/** GET /api/cars -> { data: Car[], meta: { current_page, last_page, total, … } } */
export async function fetchCars(params, { signal } = {}) {
  const { data } = await api.get('/api/cars', { params, signal })
  return data
}

/** GET /api/cars/featured -> Car[] */
export async function fetchFeaturedCars({ signal } = {}) {
  const { data } = await api.get('/api/cars/featured', { signal })
  return data.data
}

/** GET /api/cars/{slug} -> { car, similar } */
export async function fetchCar(slug, { signal } = {}) {
  const { data } = await api.get(`/api/cars/${encodeURIComponent(slug)}`, { signal })
  return { car: data.data, similar: data.similar ?? [] }
}

/** GET /api/cars/{slug}/availability -> { from, to, unavailable: [{ from, to }] } */
export async function fetchCarAvailability(slug, { signal } = {}) {
  const { data } = await api.get(`/api/cars/${encodeURIComponent(slug)}/availability`, { signal })
  return data.data
}

/** GET /api/catalog/filters -> { categories, brands, locations, transmissions, fuels, seats, price } */
export async function fetchCatalogFilters({ signal } = {}) {
  const { data } = await api.get('/api/catalog/filters', { signal })
  return data.data
}

/** GET /api/categories -> Category[] (with cars_count) */
export async function fetchCategories({ signal } = {}) {
  const { data } = await api.get('/api/categories', { signal })
  return data.data
}

/** GET /api/locations -> Location[] (active, with opening hours) */
export async function fetchLocations({ signal } = {}) {
  const { data } = await api.get('/api/locations', { signal })
  return data.data
}

/** GET /api/extras -> Extra[] (active) */
export async function fetchExtras({ signal } = {}) {
  const { data } = await api.get('/api/extras', { signal })
  return data.data
}

/** POST /api/contact { name, email, phone?, subject, message } -> { message } */
export async function sendContactMessage(payload) {
  const { data } = await api.post('/api/contact', payload)
  return data
}
