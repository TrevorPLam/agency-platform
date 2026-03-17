import { test, expect } from '@playwright/test'

test.describe('Client Site Critical User Journeys - Riley Day Care', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to client site
    await page.goto('/')
  })

  test('client homepage loads with branding', async ({ page }) => {
    // Verify client-specific branding
    await expect(page).toHaveTitle(/Riley Day Care/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Riley Day Care')
    
    // Verify navigation elements
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible()
    
    // Verify client-specific content
    await expect(page.getByText(/daycare/i)).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('client contact form journey', async ({ page }) => {
    // Navigate to contact page
    await page.getByRole('link', { name: /contact/i }).click()
    await expect(page).toHaveURL(/.*contact/)
    
    // Verify contact form is present
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/child name/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible()
    
    // Fill out contact form
    await page.getByLabel(/name/i).fill('Parent Name')
    await page.getByLabel(/email/i).fill('parent@example.com')
    await page.getByLabel(/phone/i).fill('555-123-4567')
    await page.getByLabel(/child name/i).fill('Child Name')
    await page.getByLabel(/message/i).fill('I am interested in daycare services for my child')
    
    // Submit form
    await page.getByRole('button', { name: /send/i }).click()
    
    // Verify form submission
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
  })

  test('client services information journey', async ({ page }) => {
    // Navigate to services page
    await page.getByRole('link', { name: /services/i }).click()
    await expect(page).toHaveURL(/.*services/)
    
    // Verify services content
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible()
    await expect(page.getByText(/daycare services/i)).toBeVisible()
    await expect(page.getByText(/infant care/i)).toBeVisible()
    await expect(page.getByText(/toddler program/i)).toBeVisible()
    
    // Test service details expand/collapse
    const serviceDetails = page.getByText(/learn more/i)
    if (await serviceDetails.isVisible()) {
      await serviceDetails.first().click()
      await expect(page.getByText(/program details/i)).toBeVisible()
    }
  })

  test('client login journey', async ({ page }) => {
    // Navigate to login
    await page.getByRole('link', { name: /login/i }).click()
    await expect(page).toHaveURL(/.*login/)
    
    // Verify login form
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Fill in login credentials
    await page.getByLabel(/email/i).fill('parent@rileydaycare.com')
    await page.getByLabel(/password/i).fill('parent-password')
    
    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByRole('heading', { name: /parent dashboard/i })).toBeVisible()
  })

  test('client registration journey', async ({ page }) => {
    // Navigate to registration
    await page.getByRole('link', { name: /register/i }).click()
    await expect(page).toHaveURL(/.*register/)
    
    // Verify registration form
    await expect(page.getByRole('heading', { name: /register/i })).toBeVisible()
    await expect(page.getByLabel(/parent name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/child name/i)).toBeVisible()
    await expect(page.getByLabel(/child age/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /register/i })).toBeVisible()
    
    // Fill in registration form
    await page.getByLabel(/parent name/i).fill('New Parent')
    await page.getByLabel(/email/i).fill('newparent@example.com')
    await page.getByLabel(/phone/i).fill('555-987-6543')
    await page.getByLabel(/child name/i).fill('New Child')
    await page.getByLabel(/child age/i).fill('3')
    
    // Submit registration
    await page.getByRole('button', { name: /register/i }).click()
    
    // Verify registration success
    await expect(page.getByText(/registration successful/i)).toBeVisible()
  })

  test('client responsive design - mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Test mobile navigation
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    
    // Verify content accessibility on mobile
    await expect(page.getByText(/daycare/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible()
  })

  test('client accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /home/i })).toBeFocused()
    
    // Test semantic HTML
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Test form accessibility
    await page.getByRole('link', { name: /contact/i }).click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    
    // Verify ARIA attributes
    await expect(page.getByLabel(/name/i)).toHaveAttribute('aria-required', 'true')
    await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true')
  })

  test('client error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    await expect(page.getByText(/not found/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /404/i })).toBeVisible()
    
    // Test form validation
    await page.goto('/contact')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Verify validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/phone is required/i)).toBeVisible()
  })

  test('client performance', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads quickly
    expect(loadTime).toBeLessThan(3000)
    
    // Verify key elements load quickly
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 2000 })
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 2000 })
  })
})

test.describe('Client Site Critical User Journeys - The Barber Cave', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to client site
    await page.goto('/')
  })

  test('barber shop homepage loads with branding', async ({ page }) => {
    // Verify client-specific branding
    await expect(page).toHaveTitle(/The Barber Cave/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Barber Cave')
    
    // Verify barber-specific content
    await expect(page.getByText(/barber/i)).toBeVisible()
    await expect(page.getByText(/haircut/i)).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('barber shop booking journey', async ({ page }) => {
    // Navigate to booking page
    await page.getByRole('link', { name: /book appointment/i }).click()
    await expect(page).toHaveURL(/.*book/)
    
    // Verify booking form
    await expect(page.getByRole('heading', { name: /book appointment/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/service type/i)).toBeVisible()
    await expect(page.getByLabel(/preferred date/i)).toBeVisible()
    await expect(page.getByLabel(/preferred time/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /book appointment/i })).toBeVisible()
    
    // Fill out booking form
    await page.getByLabel(/name/i).fill('Customer Name')
    await page.getByLabel(/email/i).fill('customer@example.com')
    await page.getByLabel(/phone/i).fill('555-123-4567')
    await page.getByLabel(/service type/i).selectOption('haircut')
    await page.getByLabel(/preferred date/i).fill('2026-03-20')
    await page.getByLabel(/preferred time/i).selectOption('10:00 AM')
    
    // Submit booking
    await page.getByRole('button', { name: /book appointment/i }).click()
    
    // Verify booking success
    await expect(page.getByText(/appointment booked/i)).toBeVisible()
  })

  test('barber shop services journey', async ({ page }) => {
    // Navigate to services page
    await page.getByRole('link', { name: /services/i }).click()
    await expect(page).toHaveURL(/.*services/)
    
    // Verify services content
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible()
    await expect(page.getByText(/haircuts/i)).toBeVisible()
    await expect(page.getByText(/beard trims/i)).toBeVisible()
    await expect(page.getByText(/shaves/i)).toBeVisible()
    
    // Test service selection
    const serviceOptions = page.getByRole('button', { name: /learn more/i })
    if (await serviceOptions.isVisible()) {
      await serviceOptions.first().click()
      await expect(page.getByText(/service details/i)).toBeVisible()
    }
  })

  test('barber shop gallery journey', async ({ page }) => {
    // Navigate to gallery page
    await page.getByRole('link', { name: /gallery/i }).click()
    await expect(page).toHaveURL(/.*gallery/)
    
    // Verify gallery content
    await expect(page.getByRole('heading', { name: /gallery/i })).toBeVisible()
    await expect(page.getByRole('img')).toHaveCount(0) // Wait for images to load
    
    // Test image gallery interaction
    const images = page.getByRole('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Click first image
      await images.first().click()
      
      // Verify lightbox/modal opens
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('img')).toBeVisible()
      
      // Close lightbox
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }
  })

  test('barber shop pricing journey', async ({ page }) => {
    // Navigate to pricing page
    await page.getByRole('link', { name: /pricing/i }).click()
    await expect(page).toHaveURL(/.*pricing/)
    
    // Verify pricing content
    await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible()
    await expect(page.getByText(/haircut/i)).toBeVisible()
    await expect(page.getByText(/\$\d+/)).toBeVisible() // Price format
    
    // Test pricing table accessibility
    const pricingTable = page.getByRole('table')
    if (await pricingTable.isVisible()) {
      await expect(pricingTable).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /service/i })).toBeVisible()
      await expect(page.getByRole('columnheader', { name: /price/i })).toBeVisible()
    }
  })

  test('barber shop responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Test mobile navigation
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    
    // Verify content accessibility on mobile
    await expect(page.getByText(/barber/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /book appointment/i })).toBeVisible()
  })

  test('barber shop accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /home/i })).toBeFocused()
    
    // Test semantic HTML
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Test form accessibility
    await page.getByRole('link', { name: /book appointment/i }).click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    
    // Verify ARIA attributes
    await expect(page.getByLabel(/name/i)).toHaveAttribute('aria-required', 'true')
    await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true')
  })
})
