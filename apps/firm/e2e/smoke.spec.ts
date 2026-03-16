import { test, expect } from '@playwright/test'

test('firm home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Agency/i)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
