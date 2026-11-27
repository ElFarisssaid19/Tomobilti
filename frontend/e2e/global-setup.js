import { request } from '@playwright/test'
import { API_URL, APP_URL, cleanupE2eData } from './support/api.js'

/** The dev servers must already run; leftovers of an interrupted run are removed first. */
export default async function globalSetup() {
  const context = await request.newContext()
  try {
    const [api, app] = await Promise.all([
      context.get(`${API_URL}/api/health`).catch(() => null),
      context.get(APP_URL).catch(() => null),
    ])
    if (!api?.ok() || !app?.ok()) {
      throw new Error(
        `The e2e tests need the running app: start "npm run dev" at the repository root (API ${API_URL}, SPA ${APP_URL}).`,
      )
    }
  } finally {
    await context.dispose()
  }
  cleanupE2eData()
}
