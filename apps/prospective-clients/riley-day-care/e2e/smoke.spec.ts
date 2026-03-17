import { expect, test } from '@playwright/test'

test('riley-day-care home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

test('riley-day-care contact page is reachable', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.locator('body')).toBeVisible()
})
