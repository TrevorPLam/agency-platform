import { test, expect } from '@playwright/test'

test('firm unknown route returns not-found UI', async ({ page }) => {
  await page.goto('/route-that-does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('contact form shows required fields', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Message')).toBeVisible()
})
