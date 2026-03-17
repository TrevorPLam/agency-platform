import { expect, test } from '@playwright/test'

test('agency-admin home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

test('agency-admin unknown route returns not-found response', async ({ page }) => {
  const response = await page.goto('/route-that-does-not-exist')
  expect(response?.status()).toBe(404)
})
