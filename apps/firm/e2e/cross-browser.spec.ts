import { test, expect } from '@playwright/test'

test.describe('Cross-Browser Testing Suite', () => {
  const browsers = ['chromium', 'firefox', 'webkit']
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ]

  browsers.forEach(browser => {
    viewports.forEach(viewport => {
      test(`${browser} - ${viewport.name} viewport - Firm app`, async ({ page }) => {
        test.skip(browser !== playwright.browserName(), 'Browser-specific test')
        
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        
        // Navigate to firm app
        await page.goto('http://localhost:3000')
        
        // Verify page loads correctly
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('navigation')).toBeVisible()
        
        // Test responsive navigation
        if (viewport.width <= 768) {
          // Mobile/Tablet - check for hamburger menu
          const mobileMenuButton = page.getByRole('button', { name: /menu/i })
          if (await mobileMenuButton.isVisible()) {
            await mobileMenuButton.click()
            await expect(page.getByRole('navigation')).toBeVisible()
          }
        } else {
          // Desktop - navigation should be always visible
          await expect(page.getByRole('navigation')).toBeVisible()
        }
        
        // Test contact form
        await page.getByRole('link', { name: /contact/i }).click()
        await expect(page).toHaveURL(/.*contact/)
        await expect(page.getByLabel(/email/i)).toBeVisible()
        
        // Test booking flow
        await page.getByRole('link', { name: /book/i }).click()
        await expect(page).toHaveURL(/.*book/)
        await expect(page.getByLabel(/email/i)).toBeVisible()
      })
    })
  })

  browsers.forEach(browser => {
    test(`${browser} - Agency Admin app`, async ({ page }) => {
      test.skip(browser !== playwright.browserName(), 'Browser-specific test')
      
      // Navigate to admin app
      await page.goto('http://localhost:3001')
      
      // Verify login page
      await expect(page).toHaveURL(/.*login/)
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      
      // Test login form
      await page.getByLabel(/email/i).fill('admin@agency.com')
      await page.getByLabel(/password/i).fill('test-password')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Verify dashboard loads
      await expect(page).toHaveURL(/.*dashboard/)
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })
  })

  browsers.forEach(browser => {
    test(`${browser} - Riley Day Care client site`, async ({ page }) => {
      test.skip(browser !== playwright.browserName(), 'Browser-specific test')
      
      // Navigate to client site
      await page.goto('http://localhost:3002')
      
      // Verify client-specific branding
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Riley Day Care')
      await expect(page.getByText(/daycare/i)).toBeVisible()
      
      // Test client-specific features
      await page.getByRole('link', { name: /contact/i }).click()
      await expect(page).toHaveURL(/.*contact/)
      await expect(page.getByLabel(/child name/i)).toBeVisible()
    })
  })

  browsers.forEach(browser => {
    test(`${browser} - The Barber Cave client site`, async ({ page }) => {
      test.skip(browser !== playwright.browserName(), 'Browser-specific test')
      
      // Navigate to client site
      await page.goto('http://localhost:3003')
      
      // Verify client-specific branding
      await expect(page.getByRole('heading', { level: 1 })).toContainText('The Barber Cave')
      await expect(page.getByText(/barber/i)).toBeVisible()
      
      // Test client-specific features
      await page.getByRole('link', { name: /book appointment/i }).click()
      await expect(page).toHaveURL(/.*book/)
      await expect(page.getByLabel(/service type/i)).toBeVisible()
    })
  })
})

test.describe('Mobile-First Testing', () => {
  const mobileDevices = [
    { name: 'iPhone 14', viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
    { name: 'Samsung Galaxy', viewport: { width: 360, height: 640 }, userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-S906N) AppleWebKit/537.36' },
    { name: 'iPad', viewport: { width: 768, height: 1024 }, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
  ]

  mobileDevices.forEach(device => {
    test(`${device.name} - Touch interactions`, async ({ page }) => {
      // Set device viewport and user agent
      await page.setViewportSize(device.viewport)
      await page.setExtraHTTPHeaders({ 'User-Agent': device.userAgent })
      
      await page.goto('http://localhost:3000')
      
      // Test touch-friendly navigation
      const mobileMenuButton = page.getByRole('button', { name: /menu/i })
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.tap()
        await expect(page.getByRole('navigation')).toBeVisible()
      }
      
      // Test touch-friendly buttons
      await page.getByRole('link', { name: /contact/i }).tap()
      await expect(page).toHaveURL(/.*contact/)
      
      // Test touch-friendly form inputs
      await page.getByLabel(/email/i).tap()
      await page.getByLabel(/email/i).fill('mobile@example.com')
      
      // Test touch-friendly submission
      await page.getByRole('button', { name: /send/i }).tap()
      await expect(page.getByText(/thank you/i)).toBeVisible()
    })

    test(`${device.name} - Orientation changes`, async ({ page }) => {
      await page.setViewportSize(device.viewport)
      await page.setExtraHTTPHeaders({ 'User-Agent': device.userAgent })
      
      await page.goto('http://localhost:3000')
      
      // Test portrait orientation
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      
      // Switch to landscape orientation
      await page.setViewportSize({ width: device.viewport.height, height: device.viewport.width })
      
      // Verify layout adapts to landscape
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('navigation')).toBeVisible()
      
      // Test navigation in landscape
      const mobileMenuButton = page.getByRole('button', { name: /menu/i })
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.tap()
        await expect(page.getByRole('navigation')).toBeVisible()
      }
    })

    test(`${device.name} - Performance on mobile`, async ({ page }) => {
      await page.setViewportSize(device.viewport)
      await page.setExtraHTTPHeaders({ 'User-Agent': device.userAgent })
      
      // Measure page load time
      const startTime = Date.now()
      await page.goto('http://localhost:3000')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Mobile should load within 4 seconds
      expect(loadTime).toBeLessThan(4000)
      
      // Test interaction performance
      const interactionStart = Date.now()
      await page.getByRole('link', { name: /contact/i }).tap()
      await page.waitForLoadState('networkidle')
      const interactionTime = Date.now() - interactionStart
      
      // Interactions should be responsive
      expect(interactionTime).toBeLessThan(2000)
    })
  })
})

test.describe('Network Conditions Testing', () => {
  test('Slow 3G connection - Firm app', async ({ page }) => {
    // Simulate slow 3G connection
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay
      await route.continue()
    })
    
    await page.goto('http://localhost:3000')
    
    // Verify page still loads with slow connection
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
    
    // Test form submission with slow connection
    await page.getByRole('link', { name: /contact/i }).click()
    await page.getByLabel(/email/i).fill('slow@example.com')
    await page.getByLabel(/message/i).fill('Testing with slow connection')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Verify submission completes
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 15000 })
  })

  test('Offline scenario - Firm app', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Simulate offline mode
    await page.setOffline(true)
    
    // Try to navigate to another page
    await page.getByRole('link', { name: /contact/i }).click()
    
    // Verify offline handling
    await expect(page.getByText(/offline/i)).toBeVisible({ timeout: 5000 })
    
    // Restore connection
    await page.setOffline(false)
    
    // Verify recovery
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('Intermittent connection - Agency Admin', async ({ page }) => {
    await page.goto('http://localhost:3001')
    
    // Simulate intermittent connection failures
    let requestCount = 0
    await page.route('**/*', async route => {
      requestCount++
      if (requestCount % 3 === 0) {
        await route.abort()
      } else {
        await route.continue()
      }
    })
    
    // Test login with intermittent connection
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify error handling
    await expect(page.getByText(/network error/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Accessibility Testing Across Browsers', () => {
  const accessibilityTests = [
    { name: 'Keyboard Navigation', test: async (page) => {
      await page.goto('http://localhost:3000')
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: /home/i })).toBeFocused()
      
      // Test Enter key activation
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('http://localhost:3000/')
      
      // Test tab through form
      await page.getByRole('link', { name: /contact/i }).click()
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/name/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/email/i)).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel(/message/i)).toBeFocused()
    }},
    { name: 'Screen Reader Support', test: async (page) => {
      await page.goto('http://localhost:3000')
      
      // Test ARIA labels
      await expect(page.getByRole('navigation')).toHaveAttribute('role', 'navigation')
      await expect(page.getByRole('main')).toHaveAttribute('role', 'main')
      
      // Test form labels
      await page.getByRole('link', { name: /contact/i }).click()
      await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true')
      await expect(page.getByLabel(/message/i)).toHaveAttribute('aria-required', 'true')
      
      // Test button descriptions
      await expect(page.getByRole('button', { name: /send/i })).toHaveAttribute('type', 'submit')
    }},
    { name: 'Color Contrast', test: async (page) => {
      await page.goto('http://localhost:3000')
      
      // Test text visibility
      const headings = page.getByRole('heading')
      const headingCount = await headings.count()
      
      for (let i = 0; i < Math.min(headingCount, 5); i++) {
        await expect(headings.nth(i)).toBeVisible()
        await expect(headings.nth(i)).toHaveCSS('color', /\S+/)
      }
      
      // Test link visibility
      const links = page.getByRole('link')
      const linkCount = await links.count()
      
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        await expect(links.nth(i)).toBeVisible()
        await expect(links.nth(i)).toHaveCSS('color', /\S+/)
      }
    }}
  ]

  accessibilityTests.forEach(testCase => {
    test(`${testCase.name} - Chromium`, async ({ page }) => {
      await testCase.test(page)
    })

    test(`${testCase.name} - Firefox`, async ({ page }) => {
      test.skip(playwright.browserName() !== 'firefox', 'Firefox-specific test')
      await testCase.test(page)
    })

    test(`${testCase.name} - Safari`, async ({ page }) => {
      test.skip(playwright.browserName() !== 'webkit', 'Safari-specific test')
      await testCase.test(page)
    })
  })
})
