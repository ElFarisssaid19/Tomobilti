import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './support/ui.js'

test('home → catalogue with filters → car detail, each page accessible', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Tomobilti, location de voitures au Maroc')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectNoSeriousA11yViolations(page)

  await page.getByRole('navigation').getByRole('link', { name: 'Voitures' }).first().click()
  await expect(page).toHaveURL(/\/voitures$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Nos voitures' })).toBeVisible()
  const results = page.getByRole('heading', { level: 2, name: /\d+ voitures?$/ })
  await expect(results).toBeVisible()
  const allCount = Number((await results.textContent()).match(/\d+/)[0])

  // A category chip and a filter both write to the URL and narrow the list.
  await page.getByRole('button', { name: /^SUV/ }).click()
  await expect(page).toHaveURL(/category=suv/)
  await page
    .getByRole('complementary', { name: 'Filtres' })
    .getByRole('button', { name: 'Automatique' })
    .click()
  await expect(page).toHaveURL(/transmission=automatic/)
  await expect(results).not.toHaveText(`${allCount} voitures`)
  await expectNoSeriousA11yViolations(page)

  const firstCar = page.getByRole('main').getByRole('article').first().getByRole('link').first()
  const carName = (await firstCar.textContent()).trim()
  await firstCar.click()
  await expect(page).toHaveURL(/\/voitures\/[a-z0-9-]+/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(carName.split(' ')[0])
  await expect(page.getByRole('heading', { name: 'Caractéristiques' })).toBeVisible()
  await expectNoSeriousA11yViolations(page)
})
