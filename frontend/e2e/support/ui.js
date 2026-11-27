import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'

/** Signs in through the login form and waits for the redirect. */
export async function signIn(page, { email, password }, landing = /\/espace\/profil|\/admin/) {
  await page.goto('/connexion')
  const form = page.getByRole('main')
  await form.getByRole('textbox', { name: 'Adresse e-mail' }).fill(email)
  await form.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(password)
  await form.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(landing)
}

/** No serious or critical WCAG 2.2 AA violation on the current page. */
export async function expectNoSeriousA11yViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const blocking = results.violations
    .filter((violation) => ['serious', 'critical'].includes(violation.impact))
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`)
  expect(blocking, 'serious or critical axe violations').toEqual([])
}

/** The open dialog (Headless UI panel) lies inside the viewport. */
export async function expectDialogInViewport(page) {
  // role="dialog" sits on a wrapper without size: measure the Headless UI panel.
  const dialog = page.getByRole('dialog').locator('[id^="headlessui-dialog-panel"]')
  await expect(dialog).toBeVisible()
  // Wait for the enter animation (scale / slide) to settle.
  await page.waitForTimeout(500)
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
}
