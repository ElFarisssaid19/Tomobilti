import { useEffect, useState } from 'react'
import { fetchHealth } from '../api/health.js'

/**
 * Checks GET /api/health once on mount.
 * @returns {{ status: 'loading' | 'online' | 'offline', data: object | null }}
 */
export default function useApiHealth() {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    const controller = new AbortController()

    fetchHealth({ signal: controller.signal })
      .then((data) => {
        setState({ status: data?.status === 'ok' ? 'online' : 'offline', data })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'offline', data: error.response?.data ?? null })
      })

    return () => controller.abort()
  }, [])

  return state
}
