import api from './client.js'

/** GET /api/health -> { status, app, time, database } */
export async function fetchHealth({ signal } = {}) {
  const { data } = await api.get('/api/health', { signal })
  return data
}
