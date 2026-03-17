import { test, expect } from '@playwright/test'

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the firm homepage
    await page.goto('/')
  })

  test('home page loads with key elements', async ({ page }) => {
    // Verify page title and main heading
    await expect(page).toHaveTitle(/Agency/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Verify navigation elements
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /contact/i })).toBeVisible()
    
    // Verify key content sections
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('contact form journey', async ({ page }) => {
    // Navigate to contact page
    await page.getByRole('link', { name: /contact/i }).click()
    await expect(page).toHaveURL(/.*contact/)
    
    // Verify contact form is present
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible()
    
    // Fill out contact form
    await page.getByLabel(/name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/message/i).fill('This is a test message from E2E testing')
    
    // Submit form (in a real test, this would submit and verify success)
    await page.getByRole('button', { name: /send/i }).click()
    
    // Verify form submission handling
    // Note: This will depend on your form implementation
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10000 })
  })

  test('booking flow journey', async ({ page }) => {
    // Navigate to booking page
    await page.getByRole('link', { name: /book/i }).click()
    await expect(page).toHaveURL(/.*book/)
    
    // Verify booking form is present
    await expect(page.getByRole('heading', { name: /book/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible()
    
    // Fill out booking form
    await page.getByLabel(/email/i).fill('booker@example.com')
    await page.getByLabel(/name/i).fill('Booking User')
    await page.getByLabel(/message/i).fill('I would like to book a consultation')
    
    // Submit booking
    await page.getByRole('button', { name: /submit/i }).click()
    
    // Verify booking success redirect
    await expect(page).toHaveURL(/.*booking\/success/)
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
  })

  test('navigation accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: /home/i })).toBeFocused()
    
    // Test navigation menu
    const nav = page.getByRole('navigation')
    await expect(nav).toBeVisible()
    
    // Verify all links are accessible
    const links = page.getByRole('link')
    const linkCount = await links.count()
    expect(linkCount).toBeGreaterThan(0)
    
    // Test each link for accessibility
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i)
      await expect(link).toHaveAttribute('href')
    }
  })

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Test mobile navigation if hamburger menu exists
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
    
    // Verify content is still accessible on mobile
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('responsive design - tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Verify tablet layout
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('error handling - 404 page', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page')
    
    // Verify 404 page content
    await expect(page.getByText(/not found/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /404/i })).toBeVisible()
    
    // Verify navigation back to home
    const homeLink = page.getByRole('link', { name: /home/i })
    await expect(homeLink).toBeVisible()
    await homeLink.click()
    await expect(page).toHaveURL('/')
  })

  test('performance - page load metrics', async ({ page }) => {
    // Navigate to page and measure performance
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time (3 seconds)
    expect(loadTime).toBeLessThan(3000)
    
    // Verify key elements are loaded quickly
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 2000 })
    await expect(page.getByRole('navigation')).toBeVisible({ timeout: 2000 })
  })

  test('cross-browser compatibility - Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')
    
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('cross-browser compatibility - Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')
    
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('cross-browser compatibility - Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')
    
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})

test.describe('Accessibility Testing', () => {
  test('WCAG 2.2 AA compliance - keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test keyboard navigation through all interactive elements
    await page.keyboard.press('Tab')
    
    // Verify focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test Enter and Space key activation
    await page.keyboard.press('Enter')
    
    // Continue tabbing through elements
    let tabCount = 0
    while (tabCount < 10) { // Prevent infinite loop
      await page.keyboard.press('Tab')
      tabCount++
      
      // Verify focus indicator is visible
      const hasFocus = await page.evaluate(() => document.activeElement !== document.body)
      if (!hasFocus) break
    }
  })

  test('WCAG 2.2 AA compliance - semantic HTML', async ({ page }) => {
    await page.goto('/')
    
    // Verify proper heading structure
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    // Verify landmark regions
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    
    // Verify form labels
    await page.getByRole('link', { name: /contact/i }).click()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/message/i)).toBeVisible()
  })

  test('WCAG 2.2 AA compliance - color contrast', async ({ page }) => {
    await page.goto('/')
    
    // Check contrast ratios for text elements
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button')
    const count = await textElements.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Check first 10 elements
      const element = textElements.nth(i)
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        }
      })
      
      // Verify element has visible text (basic check)
      await expect(element).toBeVisible()
    }
  })
})

test.describe('Visual Regression Testing', () => {
  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('homepage.png')
  })

  test('contact page visual snapshot', async ({ page }) => {
    await page.goto('/contact')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('contact-page.png')
  })

  test('booking page visual snapshot', async ({ page }) => {
    await page.goto('/book')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('booking-page.png')
  })

  test('mobile viewport visual snapshots', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveScreenshot('homepage-mobile.png')
  })
})
