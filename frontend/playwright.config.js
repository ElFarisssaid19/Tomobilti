import { defineConfig, devices } from '@playwright/test'
import { APP_URL } from './e2e/support/api.js'

/**
 * End-to-end tests (Playwright Test + axe-core). They run against the dev servers
 * (`npm run dev` at the repository root: API, queue worker, Vite) and Mailpit, with the
 * Chrome installed on the machine (no browser download). README, "End-to-end tests".
 */
export default defineConfig({
  testDir: './e2e',
  // One worker: the specs share the database of the running app.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL: APP_URL,
    locale: 'fr-FR',
    timezoneId: 'Africa/Casablanca',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1366, height: 650 },
      },
    },
  ],
})
