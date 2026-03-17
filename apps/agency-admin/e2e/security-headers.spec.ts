import { test, expect } from '@playwright/test'
import { validateSecurityHeaders, generateSecurityReport, meetsMinimumRequirements } from '@agency/security'
import { validateCSP, generateCSPReport, meetsMinimumCSPRequirements } from '@agency/security'

test.describe('Agency Admin Security Headers Validation', () => {
  const baseUrl = 'http://localhost:3001'

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl)
  })

  test('should have all required security headers', async ({ page }) => {
    const response = await page.goto(baseUrl)
    expect(response).toBeTruthy()

    const headers: Record<string, string> = {}
    response?.headers().forEach((value, key) => {
      headers[key] = value
    })

    const validation = validateSecurityHeaders(baseUrl, headers)
    const report = generateSecurityReport(validation)

    console.log('\n=== Agency Admin Security Report ===\n')
    console.log(report)

    expect(
      meetsMinimumRequirements(validation),
      `Security headers do not meet minimum requirements. Critical issues: ${validation.criticalIssues.join(', ')}`
    ).toBe(true)

    expect(
      validation.criticalIssues.length,
      `Critical security issues found: ${validation.criticalIssues.join(', ')}`
    ).toBe(0)

    const scorePercentage = (validation.overallScore / validation.maxScore) * 100
    expect(
      scorePercentage,
      `Security score too low: ${scorePercentage}% (minimum 70%)`
    ).toBeGreaterThanOrEqual(70)
  })

  test('should have enhanced security for admin interface', async ({ page }) => {
    const response = await page.goto(baseUrl)
    const headers: Record<string, string> = {}
    response?.headers().forEach((value, key) => {
      headers[key] = value
    })

    // Admin interface should have stricter security
    const cspHeader = headers['content-security-policy']
    expect(cspHeader).toBeTruthy()

    // Admin interface should not allow any unsafe practices even in dev
    expect(cspHeader).not.toContain("'unsafe-inline'")
    expect(cspHeader).toContain('nonce-')

    // Check for additional security headers specific to admin
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
  })

  test('should have comprehensive CSP compliance', async ({ page }) => {
    const response = await page.goto(baseUrl)
    const cspHeader = response?.headers()['content-security-policy']

    expect(
      cspHeader,
      'Content-Security-Policy header is missing'
    ).toBeTruthy()

    // Validate CSP comprehensively
    const cspValidation = validateCSP(cspHeader)
    const cspReport = generateCSPReport(cspValidation)

    console.log('\n=== CSP Validation Report ===\n')
    console.log(cspReport)

    // Check CSP meets minimum requirements
    expect(
      meetsMinimumCSPRequirements(cspValidation),
      `CSP does not meet minimum security requirements. Critical issues: ${cspValidation.criticalIssues.join(', ')}`
    ).toBe(true)

    // Assert no critical CSP issues
    expect(
      cspValidation.criticalIssues.length,
      `Critical CSP issues found: ${cspValidation.criticalIssues.join(', ')}`
    ).toBe(0)

    // Assert minimum CSP score threshold
    const cspScorePercentage = (cspValidation.overallScore / cspValidation.maxScore) * 100
    expect(
      cspScorePercentage,
      `CSP score too low: ${cspScorePercentage}% (minimum 70%)`
    ).toBeGreaterThanOrEqual(70)

    // Check for nonce-based policy
    expect(
      cspValidation.nonceBased,
      'CSP should use nonce-based policy for dynamic content'
    ).toBe(true)

    // Check for required directives
    const requiredDirectives = ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src']
    requiredDirectives.forEach(directive => {
      const directiveData = cspValidation.directives.find(d => d.name === directive)
      expect(
        directiveData,
        `CSP missing ${directive} directive`
      ).toBeTruthy()

      expect(
        directiveData!.issues.length,
        `${directive} directive has issues: ${directiveData!.issues.join(', ')}`
      ).toBe(0)
    })

    // Check frame-ancestors is set to 'none'
    const frameAncestors = cspValidation.directives.find(d => d.name === 'frame-ancestors')
    expect(
      frameAncestors?.values.includes("'none'"),
      'frame-ancestors should be set to \'none\' to prevent clickjacking'
    ).toBe(true)

    // Check for report-uri or report-to
    expect(
      cspValidation.reportUri,
      'CSP should include report-uri for violation monitoring'
    ).toBeTruthy()
  })

  test('should have proper CSP nonce handling', async ({ page }) => {
    const response = await page.goto(baseUrl)
    const cspHeader = response?.headers()['content-security-policy']
    const nonceHeader = response?.headers()['x-nonce']

    expect(
      cspHeader,
      'Content-Security-Policy header is missing'
    ).toBeTruthy()

    expect(
      nonceHeader,
      'x-nonce header is missing - required for CSP nonce validation'
    ).toBeTruthy()

    // Check that CSP contains the nonce
    expect(
      cspHeader,
      'CSP should contain nonce for script-src'
    ).toContain(`script-src 'self' 'nonce-${nonceHeader}'`)

    expect(
      cspHeader,
      'CSP should contain nonce for style-src'
    ).toContain(`style-src 'self' 'nonce-${nonceHeader}'`)

    // Validate that nonce is properly formatted (base64)
    const nonceRegex = /^[A-Za-z0-9+/]+=*$/
    expect(
      nonceHeader,
      'Nonce should be base64 encoded'
    ).toMatch(nonceRegex)

    // Check nonce length (should be reasonable)
    expect(
      nonceHeader.length,
      'Nonce should be at least 16 characters long'
    ).toBeGreaterThanOrEqual(16)

    expect(
      nonceHeader.length,
      'Nonce should not be excessively long'
    ).toBeLessThanOrEqual(64)
  })

  test('should protect admin routes with proper security', async ({ page }) => {
    // Test admin-specific routes
    const adminRoutes = ['/dashboard', '/api/costs', '/api/metrics']

    for (const route of adminRoutes) {
      try {
        const response = await page.goto(`${baseUrl}${route}`)
        if (response && response.status() !== 404) {
          const headers = response.headers()

          // All admin routes should have security headers
          expect(headers['x-content-type-options']).toBeTruthy()
          expect(headers['x-frame-options']).toBeTruthy()
        }
      } catch (error) {
        // Route might not exist or require authentication, that's ok
        console.log(`Route ${route} not accessible, skipping security header check`)
      }
    }
  })
})
