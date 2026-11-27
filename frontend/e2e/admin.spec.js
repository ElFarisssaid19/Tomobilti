import { expect, test } from '@playwright/test'
import { ADMIN, createPendingReservation, createVerifiedClient } from './support/api.js'
import { signIn } from './support/ui.js'

test('the agency confirms a request, hands the car over and finds the invoice', async ({
  page,
}) => {
  const client = await createVerifiedClient('admin-flow')
  const { reference } = await createPendingReservation(client)

  await signIn(page, ADMIN, /\/admin$/)
  await expect(page.getByRole('heading', { level: 1, name: /^Bonjour/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Départs et retours' })).toBeVisible()

  // The request is in "À traiter".
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Réservations/ })
    .first()
    .click()
  await page.getByRole('main').getByRole('searchbox').fill(reference)
  await page.getByRole('main').getByRole('link', { name: reference }).click()
  await expect(page.getByRole('heading', { level: 1, name: reference })).toBeVisible()

  const main = page.getByRole('main')
  await main.getByRole('button', { name: 'Confirmer', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Confirmer cette réservation ?' })
    .getByRole('button', { name: 'Confirmer', exact: true })
    .click()
  await expect(main.getByText('Confirmée').first()).toBeVisible()

  await main.getByRole('button', { name: 'Marquer comme récupérée' }).click()
  const payment = page.getByRole('dialog', { name: 'Le client a récupéré la voiture ?' })
  await payment.getByRole('radio', { name: 'Espèces' }).check()
  await payment.getByRole('button', { name: 'Marquer comme récupérée' }).click()
  await expect(payment).toBeHidden()
  await expect(main.getByText('En cours').first()).toBeVisible()
  const invoiceNumber = (
    await main
      .getByText(/^FAC-\d{4}-\d{6}$/)
      .first()
      .textContent()
  ).trim()

  await page.getByRole('navigation').getByRole('link', { name: 'Factures' }).first().click()
  await expect(page).toHaveURL(/\/admin\/factures/)
  await page.getByRole('main').getByRole('searchbox').fill(reference)
  const invoiceRow = page.getByRole('main').getByRole('row').filter({ hasText: invoiceNumber })
  await expect(invoiceRow).toBeVisible()
  await expect(invoiceRow).toContainText('Payée')
  await expect(invoiceRow).toContainText('Espèces')
})
