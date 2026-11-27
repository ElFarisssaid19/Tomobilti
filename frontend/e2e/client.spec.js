import { expect, test } from '@playwright/test'
import { createVerifiedClient, freeCarAndDates } from './support/api.js'
import { signIn } from './support/ui.js'

test('a customer books a car, finds it in Mes réservations and cancels it', async ({ page }) => {
  const client = await createVerifiedClient('client')
  const { car, start, end } = await freeCarAndDates()

  await signIn(page, client, /\/espace\/profil/)

  // The car page passes the dates in the URL, like "Réserver" on the car page.
  await page.goto(`/reserver/${car.slug}?start_at=${start}&end_at=${end}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Réserver la ${car.name}`)
  const summary = page.getByRole('complementary', { name: 'Résumé de la réservation' })
  const next = summary.getByRole('button', { name: 'Continuer' })

  await expect(page.getByRole('heading', { level: 2, name: 'Quand et où ?' })).toBeVisible()
  await expect(summary.getByText('Total TTC')).toBeVisible()
  await next.click()

  await expect(
    page.getByRole('heading', { level: 2, name: 'Des options pour la route ?' }),
  ).toBeVisible()
  await next.click()

  await expect(page.getByRole('heading', { level: 2, name: 'Vos informations' })).toBeVisible()
  await expect(page.getByText('Vous pouvez réserver')).toBeVisible()
  await next.click()

  await expect(page.getByRole('heading', { level: 2, name: 'Vérifiez et confirmez' })).toBeVisible()
  await page
    .getByRole('main')
    .getByRole('checkbox', { name: /conditions générales/ })
    .check()
  // A double click sends one booking (useSingleFlightMutation).
  const bookings = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/reservations')) {
      bookings.push(request)
    }
  })
  await summary.getByRole('button', { name: 'Confirmer la réservation' }).dblclick()

  await expect(page.getByRole('heading', { name: 'Demande de réservation envoyée' })).toBeVisible()
  const reference = (await page.getByText(/^TMB-\d{4}-\d{6}$/).textContent()).trim()
  expect(bookings).toHaveLength(1)

  await page.goto('/espace/reservations')
  const row = page.getByRole('main').getByRole('listitem').filter({ hasText: reference })
  await expect(row).toBeVisible()
  await expect(row).toContainText('En attente')

  await row.getByRole('link').first().click()
  await expect(page).toHaveURL(new RegExp(`/espace/reservations/${reference}$`))
  await page.getByRole('main').getByRole('button', { name: 'Annuler la réservation' }).click()
  const dialog = page.getByRole('dialog', { name: 'Annuler cette réservation ?' })
  await dialog.getByRole('button', { name: 'Annuler la réservation' }).click()

  await expect(page.getByText('Réservation annulée').first()).toBeVisible()
  await expect(page.getByRole('main').getByText('Annulée').first()).toBeVisible()
})
