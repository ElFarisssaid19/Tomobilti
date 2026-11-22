import { afterEach, describe, expect, it, vi } from 'vitest'
import api, { onUnauthorized } from './client.js'

function respond(status, config) {
  if (status < 400) return Promise.resolve({ status, data: {}, headers: {}, config })
  return Promise.reject(
    Object.assign(new Error(`HTTP ${status}`), { config, response: { status, data: {} } }),
  )
}

describe('api client interceptors', () => {
  const originalAdapter = api.defaults.adapter
  afterEach(() => {
    api.defaults.adapter = originalAdapter
  })

  it('fetches a new CSRF cookie and replays the request once after a 419', async () => {
    const calls = []
    api.defaults.adapter = vi.fn((config) => {
      calls.push(config.url)
      const replayed = calls.filter((url) => url === '/api/profile').length > 1
      if (config.url === '/api/profile' && !replayed) return respond(419, config)
      return respond(200, config)
    })

    await api.put('/api/profile', { name: 'Omar' })

    expect(calls).toEqual(['/api/profile', '/sanctum/csrf-cookie', '/api/profile'])
  })

  it('does not loop when the replay fails with 419 again', async () => {
    api.defaults.adapter = vi.fn((config) =>
      config.url === '/sanctum/csrf-cookie' ? respond(204, config) : respond(419, config),
    )

    await expect(api.put('/api/profile', {})).rejects.toMatchObject({ response: { status: 419 } })
    expect(api.defaults.adapter).toHaveBeenCalledTimes(3)
  })

  it('notifies the auth layer on 401', async () => {
    const handler = vi.fn()
    const unregister = onUnauthorized(handler)
    api.defaults.adapter = vi.fn((config) => respond(401, config))

    await expect(api.get('/api/user')).rejects.toBeTruthy()
    expect(handler).toHaveBeenCalledTimes(1)
    unregister()
  })
})
