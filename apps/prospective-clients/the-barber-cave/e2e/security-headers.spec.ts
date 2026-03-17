import { test, expect } from '@playwright/test'
import { validateSecurityHeaders, generateSecurityReport, meetsMinimumRequirements } from '@agency/security'

test.describe('The Barber Cave Security Headers Validation', () => {
  const baseUrl = 'http://localhost:3003'

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
    
    console.log('\n=== The Barber Cave Security Report ===\n')
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

  test('should have client-specific security configuration', async ({ page }) => {
    const response = await page.goto(baseUrl)
    const headers: Record<string, string> = {}
    response?.headers().forEach((value, key) => {
      headers[key] = value
    })

    // Client sites should have proper security headers
    expect(headers['content-security-policy']).toBeTruthy()
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBeTruthy()
    expect(headers['permissions-policy']).toBeTruthy()
  })
})
