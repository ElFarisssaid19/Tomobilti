import api from './client.js'

/*
 * The bell (backend/routes/api.php, "notifications"): the signed-in user's in-app
 * notifications, customers and admins alike.
 */

/**
 * GET /api/notifications?status=all|unread|read&page= -> { data: [{ id, type, title, body,
 * reference, url, read_at, created_at }], meta: { unread_count, current_page, last_page, total } }
 */
export async function fetchNotifications({ params, signal } = {}) {
  const { data } = await api.get('/api/notifications', { params, signal })
  return data
}

/** POST /api/notifications/{id}/read -> { data, meta: { unread_count } } */
export async function markNotificationRead(id) {
  const { data } = await api.post(`/api/notifications/${encodeURIComponent(id)}/read`)
  return data
}

/** POST /api/notifications/read-all -> { message, meta: { unread_count: 0 } } */
export async function markAllNotificationsRead() {
  const { data } = await api.post('/api/notifications/read-all')
  return data
}
