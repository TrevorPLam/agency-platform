import { expect, test } from '@playwright/test'

test('the-barber-cave home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

test('the-barber-cave services page is reachable', async ({ page }) => {
  await page.goto('/services')
  await expect(page.locator('body')).toBeVisible()
})
