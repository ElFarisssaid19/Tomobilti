import api from './client.js'

/*
 * Back-office endpoints (backend/routes/api.php, "Admin area"): auth:sanctum + admin.
 * Each function returns the payload; pages go through hooks/useAdmin.js.
 */

/** GET /api/admin/dashboard?period=30d|90d|12m */
export async function fetchDashboard(period, { signal } = {}) {
  const { data } = await api.get('/api/admin/dashboard', { params: { period }, signal })
  return data.data
}

/* Reservations ---------------------------------------------------------------- */

/** GET /api/admin/reservations -> { data, meta: { counts, tab, current_page, last_page, total } } */
export async function fetchAdminReservations(params, { signal } = {}) {
  const { data } = await api.get('/api/admin/reservations', { params, signal })
  return data
}

export async function fetchAdminReservation(reference, { signal } = {}) {
  const { data } = await api.get(`/api/admin/reservations/${encodeURIComponent(reference)}`, {
    signal,
  })
  return data.data
}

/** Endpoint of each reservation action. */
const ACTION_PATHS = {
  confirm: 'confirm',
  reject: 'reject',
  pickUp: 'pick-up',
  return: 'return',
  cancel: 'cancel',
}

/** POST /api/admin/reservations/{reference}/{action} { reason? } -> { reservation, message } */
export async function runReservationAction(reference, action, reason) {
  const { data } = await api.post(
    `/api/admin/reservations/${encodeURIComponent(reference)}/${ACTION_PATHS[action]}`,
    reason ? { reason } : {},
  )
  return { reservation: data.data, message: data.message }
}

export async function saveReservationNotes(reference, adminNotes) {
  const { data } = await api.patch(
    `/api/admin/reservations/${encodeURIComponent(reference)}/notes`,
    { admin_notes: adminNotes || null },
  )
  return { reservation: data.data, message: data.message }
}

/** GET /api/admin/reservations/export -> CSV file (Blob), with the list's filters. */
export async function exportReservations(params) {
  const response = await api.get('/api/admin/reservations/export', {
    params,
    responseType: 'blob',
  })
  const disposition = response.headers['content-disposition'] ?? ''
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'reservations.csv'
  return { blob: response.data, filename }
}

/** GET /api/admin/planning?from&to -> { from, to, cars: [{ …, reservations }] } */
export async function fetchPlanning(params, { signal } = {}) {
  const { data } = await api.get('/api/admin/planning', { params, signal })
  return data.data
}

/* Cars ------------------------------------------------------------------------ */

export async function fetchAdminCars(params, { signal } = {}) {
  const { data } = await api.get('/api/admin/cars', { params, signal })
  return data
}

export async function fetchAdminCar(id, { signal } = {}) {
  const { data } = await api.get(`/api/admin/cars/${id}`, { signal })
  return data.data
}

/** POST (new) or PUT (existing) -> { car, message } */
export async function saveCar(id, payload) {
  const { data } = id
    ? await api.put(`/api/admin/cars/${id}`, payload)
    : await api.post('/api/admin/cars', payload)
  return { car: data.data, message: data.message }
}

export async function deleteCar(id) {
  const { data } = await api.delete(`/api/admin/cars/${id}`)
  return data
}

export async function restoreCar(id) {
  const { data } = await api.post(`/api/admin/cars/${id}/restore`)
  return { car: data.data, message: data.message }
}

/** Pending and confirmed reservations not over yet: what a status change affects. */
export async function fetchCarStatusConflicts(id, { signal } = {}) {
  const { data } = await api.get(`/api/admin/cars/${id}/status-conflicts`, { signal })
  return data.data
}

export async function changeCarStatus(id, status, force = false) {
  const { data } = await api.patch(`/api/admin/cars/${id}/status`, { status, force })
  return { car: data.data, message: data.message }
}

/** POST multipart images[] (one file per call, so each shows its own progress). */
export async function uploadCarImage(id, file, onProgress) {
  const body = new FormData()
  body.append('images[]', file)
  const { data } = await api.post(`/api/admin/cars/${id}/images`, body, {
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return { images: data.data, message: data.message }
}

export async function updateCarImage(id, imageId, patch) {
  const { data } = await api.patch(`/api/admin/cars/${id}/images/${imageId}`, patch)
  return { images: data.data, message: data.message }
}

export async function reorderCarImages(id, ids) {
  const { data } = await api.put(`/api/admin/cars/${id}/images/order`, { ids })
  return { images: data.data, message: data.message }
}

export async function deleteCarImage(id, imageId) {
  const { data } = await api.delete(`/api/admin/cars/${id}/images/${imageId}`)
  return { images: data.data, message: data.message }
}

/* Clients --------------------------------------------------------------------- */

export async function fetchAdminClients(params, { signal } = {}) {
  const { data } = await api.get('/api/admin/clients', { params, signal })
  return data
}

export async function fetchAdminClient(id, { signal } = {}) {
  const { data } = await api.get(`/api/admin/clients/${id}`, { signal })
  return data.data
}

/** POST activate | deactivate -> { client, message } */
export async function setClientActive(id, active) {
  const { data } = await api.post(`/api/admin/clients/${id}/${active ? 'activate' : 'deactivate'}`)
  return { client: data.data, message: data.message }
}

/* Settings (categories, brands, locations, extras) ----------------------------- */

export async function fetchSettings(resource, { signal } = {}) {
  const { data } = await api.get(`/api/admin/${resource}`, { signal })
  return data.data
}

export async function saveSetting(resource, id, payload) {
  const { data } = id
    ? await api.put(`/api/admin/${resource}/${id}`, payload)
    : await api.post(`/api/admin/${resource}`, payload)
  return { item: data.data, message: data.message }
}

export async function deleteSetting(resource, id) {
  const { data } = await api.delete(`/api/admin/${resource}/${id}`)
  return data
}
