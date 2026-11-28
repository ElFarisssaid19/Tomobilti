import { expect, test } from '@playwright/test'
import { ADMIN, createPendingReservation, createVerifiedClient } from './support/api.js'
import { expectDialogInViewport, signIn } from './support/ui.js'

const VIEWPORTS = [
  { name: 'laptop 1366 × 650', width: 1366, height: 650 },
  { name: 'phone 375 × 667', width: 375, height: 667 },
]

let reference

test.beforeAll(async () => {
  const client = await createVerifiedClient('layout')
  ;({ reference } = await createPendingReservation(client))
})

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('the main dialogs fit the viewport', async ({ page }) => {
      await signIn(page, ADMIN, /\/admin$/)

      // Refusal: reason field and actions.
      await page.goto(`/admin/reservations/${reference}`)
      await page.getByRole('main').getByRole('button', { name: 'Refuser' }).click()
      await expectDialogInViewport(page)
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()

      // The longest settings form: the agency.
      await page.goto('/admin/parametres?onglet=locations')
      await page.getByRole('main').getByRole('button', { name: 'Ajouter une agence' }).click()
      await expectDialogInViewport(page)
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('button', { name: 'Ajouter une agence' })).toBeInViewport()
      await page.keyboard.press('Escape')

      // The fleet status change lists the affected reservations.
      await page.goto('/admin/voitures')
      await page
        .getByRole('main')
        .getByRole('link')
        .filter({ hasText: /\d{4}$/ })
        .first()
        .click()
      await page.getByRole('main').getByRole('button', { name: 'Changer le statut' }).click()
      await expectDialogInViewport(page)
    })

    test('admin tables show as cards on phones and as tables on laptops', async ({ page }) => {
      await signIn(page, ADMIN, /\/admin$/)
      await page.goto('/admin/reservations?onglet=all')
      const table = page.getByRole('main').getByRole('table')
      if (viewport.width < 1024) {
        await expect(table).toHaveCount(0)
        await expect(
          page.getByRole('main').getByRole('link', { name: /^TMB-/ }).first(),
        ).toBeVisible()
      } else {
        await expect(table).toBeVisible()
      }
      const scrollsSideways = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(scrollsSideways).toBe(false)
    })
  })
}
