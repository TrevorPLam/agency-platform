import { test, expect } from '@playwright/test'

test.describe('Agency Admin Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto('/login')
  })

  test('admin login journey', async ({ page }) => {
    // Verify login page loads
    await expect(page).toHaveTitle(/Admin/i)
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Fill in login credentials
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    
    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('cost management journey', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Navigate to cost management
    await page.getByRole('link', { name: /costs/i }).click()
    await expect(page).toHaveURL(/.*costs/)
    
    // Verify cost management interface
    await expect(page.getByRole('heading', { name: /cost management/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add metric/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    
    // Test cost metrics creation
    await page.getByRole('button', { name: /add metric/i }).click()
    await expect(page.getByRole('dialog', { name: /add cost metric/i })).toBeVisible()
    
    // Fill in metric form
    await page.getByLabel(/metric name/i).fill('API Calls')
    await page.getByLabel(/metric value/i).fill('1000')
    await page.getByLabel(/period/i).selectOption('daily')
    
    // Submit form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Verify metric was added
    await expect(page.getByText(/metric added successfully/i)).toBeVisible()
  })

  test('tenant management journey', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to tenant management
    await page.getByRole('link', { name: /tenants/i }).click()
    await expect(page).toHaveURL(/.*tenants/)
    
    // Verify tenant management interface
    await expect(page.getByRole('heading', { name: /tenant management/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add tenant/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    
    // Test tenant creation
    await page.getByRole('button', { name: /add tenant/i }).click()
    await expect(page.getByRole('dialog', { name: /add tenant/i })).toBeVisible()
    
    // Fill in tenant form
    await page.getByLabel(/tenant name/i).fill('Test Tenant')
    await page.getByLabel(/tenant slug/i).fill('test-tenant')
    await page.getByLabel(/domain/i).fill('test-tenant.example.com')
    
    // Submit form
    await page.getByRole('button', { name: /create tenant/i }).click()
    
    // Verify tenant was created
    await expect(page.getByText(/tenant created successfully/i)).toBeVisible()
  })

  test('dashboard analytics journey', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify dashboard analytics
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(/total tenants/i)).toBeVisible()
    await expect(page.getByText(/active users/i)).toBeVisible()
    await expect(page.getByText(/system health/i)).toBeVisible()
    
    // Test date range selection
    await page.getByLabel(/date range/i).selectOption('last-30-days')
    
    // Verify analytics update
    await expect(page.getByText(/updated/i)).toBeVisible({ timeout: 5000 })
  })

  test('user management journey', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Navigate to user management
    await page.getByRole('link', { name: /users/i }).click()
    await expect(page).toHaveURL(/.*users/)
    
    // Verify user management interface
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    
    // Test user creation
    await page.getByRole('button', { name: /add user/i }).click()
    await expect(page.getByRole('dialog', { name: /add user/i })).toBeVisible()
    
    // Fill in user form
    await page.getByLabel(/email/i).fill('newuser@example.com')
    await page.getByLabel(/name/i).fill('New User')
    await page.getByLabel(/role/i).selectOption('user')
    await page.getByLabel(/tenant/i).selectOption('test-tenant')
    
    // Submit form
    await page.getByRole('button', { name: /create user/i }).click()
    
    // Verify user was created
    await expect(page.getByText(/user created successfully/i)).toBeVisible()
  })

  test('admin navigation accessibility', async ({ page }) => {
    await page.goto('/login')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
    
    // Test ARIA labels
    await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true')
    await expect(page.getByLabel(/password/i)).toHaveAttribute('aria-required', 'true')
    
    // Test form validation
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify error messages are accessible
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('admin responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Verify mobile login layout
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Test mobile navigation after login
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify mobile dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Test mobile menu
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })

  test('admin error handling', async ({ page }) => {
    await page.goto('/login')
    
    // Test invalid credentials
    await page.getByLabel(/email/i).fill('invalid@admin.com')
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    
    // Test network error simulation
    await page.route('**/api/auth/login', route => route.abort())
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify network error handling
    await expect(page.getByText(/network error/i)).toBeVisible()
  })

  test('admin performance', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify login page loads quickly
    expect(loadTime).toBeLessThan(2000)
    
    // Test dashboard load performance
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    
    const dashboardStartTime = Date.now()
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForLoadState('networkidle')
    const dashboardLoadTime = Date.now() - dashboardStartTime
    
    // Verify dashboard loads within reasonable time
    expect(dashboardLoadTime).toBeLessThan(3000)
  })
})

test.describe('Agency Admin Security Testing', () => {
  test('session management', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Verify session persistence
    await page.reload()
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Test logout
    await page.getByRole('button', { name: /logout/i }).click()
    await expect(page).toHaveURL(/.*login/)
    
    // Verify session is cleared
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('authorization checks', async ({ page }) => {
    // Try to access protected routes without login
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
    
    await page.goto('/costs')
    await expect(page).toHaveURL(/.*login/)
    
    await page.goto('/tenants')
    await expect(page).toHaveURL(/.*login/)
  })

  test('input validation and sanitization', async ({ page }) => {
    await page.goto('/login')
    
    // Test XSS prevention
    await page.getByLabel(/email/i).fill('<script>alert("xss")</script>@example.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify script is not executed
    await expect(page.locator('script')).toHaveCount(0)
    
    // Test SQL injection prevention
    await page.getByLabel(/email/i).fill("'; DROP TABLE users; --")
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Verify proper error handling
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })
})
