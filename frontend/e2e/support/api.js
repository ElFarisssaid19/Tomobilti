/*
 * Test data for the end-to-end suite, created through the real API (and Mailpit for the
 * verification e-mail), never by writing to the database. Everything lives on the
 * reserved e-mail domain below, which `php artisan tomobilti:e2e-cleanup` removes.
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { request } from '@playwright/test'

export const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:5173'
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025'
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@tomobilti.ma',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'Tomobilti2026!',
}

/** Same domain as App\Console\Commands\CleanupE2eData::EMAIL_DOMAIN. */
export const E2E_EMAIL_DOMAIN = 'e2e.tomobilti.test'
export const E2E_PASSWORD = 'E2eTomobilti2026!'

const BACKEND_DIR = fileURLToPath(new URL('../../../backend', import.meta.url))

/** Deletes every account, reservation and invoice made by the suite. */
export function cleanupE2eData() {
  execFileSync('php', ['artisan', 'tomobilti:e2e-cleanup'], { cwd: BACKEND_DIR, stdio: 'pipe' })
}

/**
 * An API session like the SPA's: Sanctum cookies, the XSRF header on writes, and the
 * Origin / Referer of the SPA so the session is "stateful".
 */
export async function apiSession() {
  const context = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Accept: 'application/json', Origin: APP_URL, Referer: `${APP_URL}/` },
  })
  await context.get('/sanctum/csrf-cookie')

  async function xsrf() {
    const { cookies } = await context.storageState()
    return decodeURIComponent(cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '')
  }

  async function send(method, url, data) {
    const response = await context.fetch(url, {
      method,
      data,
      headers: { 'X-XSRF-TOKEN': await xsrf() },
    })
    if (!response.ok()) {
      throw new Error(`${method} ${url} → ${response.status()} ${await response.text()}`)
    }
    return response.status() === 204 ? null : response.json()
  }

  return {
    get: (url) => send('GET', url),
    post: (url, data) => send('POST', url, data),
    put: (url, data) => send('PUT', url, data),
    login: (email, password) => send('POST', '/api/auth/login', { email, password }),
    dispose: () => context.dispose(),
  }
}

/** Waits for the verification e-mail in Mailpit and returns its link. */
async function verificationLink(email) {
  const mailpit = await request.newContext({ baseURL: MAILPIT_URL })
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      const search = await mailpit.get(`/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
      const [message] = (await search.json()).messages ?? []
      if (message) {
        const { HTML } = await (await mailpit.get(`/api/v1/message/${message.ID}`)).json()
        const link = /href="([^"]*verifier-email[^"]*)"/.exec(HTML)?.[1]
        if (link) return link.replaceAll('&amp;', '&')
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  } finally {
    await mailpit.dispose()
  }
  throw new Error(
    `No verification e-mail for ${email} in Mailpit: is the queue worker running (npm run dev)?`,
  )
}

/**
 * A verified customer who can book: registered through the API, e-mail verified with
 * the link from Mailpit, profile completed (21+, licence older than 2 years).
 */
export async function createVerifiedClient(label) {
  const id = `${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const email = `${id}@${E2E_EMAIL_DOMAIN}`
  const api = await apiSession()
  await api.post('/api/auth/register', {
    name: `Client E2E ${label}`,
    email,
    phone: `06${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`,
    password: E2E_PASSWORD,
    password_confirmation: E2E_PASSWORD,
    terms: true,
  })

  // /verifier-email?id&hash&expires&signature, as the SPA's VerifyEmailPage reads it.
  const link = new URL(await verificationLink(email))
  const userId = link.searchParams.get('id')
  const hash = link.searchParams.get('hash')
  const query = new URLSearchParams({
    expires: link.searchParams.get('expires'),
    signature: link.searchParams.get('signature'),
  })
  await api.post(`/api/auth/email/verify/${userId}/${hash}?${query}`)

  await api.put('/api/profile', {
    birth_date: '1990-04-12',
    cin: `EE${String(Math.floor(100_000 + Math.random() * 899_999))}`,
    driving_license_number: `12/${String(Math.floor(100_000 + Math.random() * 899_999))}`,
    driving_license_issued_at: '2012-06-01',
  })
  await api.dispose()
  return { email, password: E2E_PASSWORD }
}

/** "YYYY-MM-DD" in the agency's timezone, `days` from today. */
export function dayFromToday(days) {
  const date = new Date(Date.now() + days * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(date)
}

/**
 * A two-day window months ahead (random, so runs never collide) and a car free on it.
 * Within the 6-month booking horizon.
 */
export async function freeCarAndDates() {
  const api = await apiSession()
  try {
    for (let attempt = 0; attempt < 10; attempt++) {
      const offset = 60 + Math.floor(Math.random() * 100)
      const start = dayFromToday(offset)
      const end = dayFromToday(offset + 2)
      const { data } = await api.get(`/api/cars?start_at=${start}&end_at=${end}&sort=price_asc`)
      if (data.length > 0) return { car: data[0], start, end }
    }
  } finally {
    await api.dispose()
  }
  throw new Error('No free car found for the e2e booking.')
}

/** A pending reservation booked through the API by `client`. Returns its reference. */
export async function createPendingReservation(client) {
  const { car, start, end } = await freeCarAndDates()
  const api = await apiSession()
  try {
    await api.login(client.email, client.password)
    const { data: reservation } = await api.post('/api/reservations', {
      car: car.slug,
      start_at: `${start} 10:00`,
      end_at: `${end} 10:00`,
      pickup_location: car.location.slug,
      return_location: car.location.slug,
      extras: [],
      terms: true,
    })
    return { reference: reservation.reference, car }
  } finally {
    await api.dispose()
  }
}
