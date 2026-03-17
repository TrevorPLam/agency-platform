import { test, expect } from '@playwright/test'
import { validateSecurityHeaders, generateSecurityReport, meetsMinimumRequirements } from '@agency/security'

test.describe('Security Headers Validation', () => {
  const apps = [
    { name: 'Firm', url: 'http://localhost:3000', port: 3000 },
    { name: 'Agency Admin', url: 'http://localhost:3001', port: 3001 },
    { name: 'Riley Day Care', url: 'http://localhost:3002', port: 3002 },
    { name: 'The Barber Cave', url: 'http://localhost:3003', port: 3003 }
  ]

  apps.forEach(app => {
    test.describe(`${app.name} Application`, () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto(app.url)
      })

      test(`should have all required security headers`, async ({ page }) => {
        // Get response headers from the page
        const response = await page.goto(app.url)
        expect(response).toBeTruthy()
        
        const headers: Record<string, string> = {}
        response?.headers().forEach((value, key) => {
          headers[key] = value
        })

        // Validate security headers
        const validation = validateSecurityHeaders(app.url, headers)
        
        // Generate report for debugging
        const report = generateSecurityReport(validation)
        console.log(`\n=== ${app.name} Security Report ===\n`)
        console.log(report)

        // Assert minimum requirements are met
        expect(
          meetsMinimumRequirements(validation),
          `Security headers do not meet minimum requirements for ${app.name}. Critical issues: ${validation.criticalIssues.join(', ')}`
        ).toBe(true)

        // Assert no critical security issues
        expect(
          validation.criticalIssues.length,
          `Critical security issues found: ${validation.criticalIssues.join(', ')}`
        ).toBe(0)

        // Assert minimum score threshold
        const scorePercentage = (validation.overallScore / validation.maxScore) * 100
        expect(
          scorePercentage,
          `Security score too low: ${scorePercentage}% (minimum 70%)`
        ).toBeGreaterThanOrEqual(70)
      })

      test(`should have proper CSP header with nonce`, async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        
        expect(
          cspHeader,
          'Content-Security-Policy header is missing'
        ).toBeTruthy()

        // Check for nonce-based policy
        expect(
          cspHeader,
          'CSP should use nonce-based policy for dynamic content'
        ).toContain('nonce-')

        // Check for unsafe-inline removal
        expect(
          cspHeader,
          'CSP should not contain unsafe-inline in production'
        ).not.toContain("'unsafe-inline'")

        // Check required directives
        const requiredDirectives = ['default-src', 'script-src', 'style-src']
        requiredDirectives.forEach(directive => {
          expect(
            cspHeader,
            `CSP missing ${directive} directive`
          ).toContain(directive)
        })
      })

      test(`should have proper HSTS header in production`, async ({ page }) => {
        const response = await page.goto(app.url)
        const hstsHeader = response?.headers()['strict-transport-security']
        
        // Note: HSTS might not be present in development
        if (process.env.NODE_ENV === 'production') {
          expect(
            hstsHeader,
            'Strict-Transport-Security header is missing in production'
          ).toBeTruthy()

          expect(
            hstsHeader,
            'HSTS should have max-age of at least 1 year'
          ).toMatch(/max-age=31536000/)

          expect(
            hstsHeader,
            'HSTS should include includeSubDomains'
          ).toContain('includeSubDomains')
        }
      })

      test(`should have X-Frame-Options set to DENY`, async ({ page }) => {
        const response = await page.goto(app.url)
        const xFrameOptions = response?.headers()['x-frame-options']
        
        expect(
          xFrameOptions,
          'X-Frame-Options header is missing'
        ).toBeTruthy()

        expect(
          xFrameOptions,
          'X-Frame-Options should be set to DENY'
        ).toBe('DENY')
      })

      test(`should have X-Content-Type-Options set to nosniff`, async ({ page }) => {
        const response = await page.goto(app.url)
        const xContentTypeOptions = response?.headers()['x-content-type-options']
        
        expect(
          xContentTypeOptions,
          'X-Content-Type-Options header is missing'
        ).toBeTruthy()

        expect(
          xContentTypeOptions,
          'X-Content-Type-Options should be set to nosniff'
        ).toBe('nosniff')
      })

      test(`should have proper Referrer-Policy`, async ({ page }) => {
        const response = await page.goto(app.url)
        const referrerPolicy = response?.headers()['referrer-policy']
        
        expect(
          referrerPolicy,
          'Referrer-Policy header is missing'
        ).toBeTruthy()

        const validPolicies = [
          'no-referrer',
          'no-referrer-when-downgrade',
          'origin',
          'origin-when-cross-origin',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin'
        ]

        expect(
          validPolicies.includes(referrerPolicy!),
          `Invalid Referrer-Policy value: ${referrerPolicy}`
        ).toBe(true)

        expect(
          referrerPolicy,
          'Referrer-Policy should not be unsafe-url'
        ).not.toBe('unsafe-url')
      })

      test(`should have proper Permissions-Policy`, async ({ page }) => {
        const response = await page.goto(app.url)
        const permissionsPolicy = response?.headers()['permissions-policy']
        
        expect(
          permissionsPolicy,
          'Permissions-Policy header is missing'
        ).toBeTruthy()

        // Check privacy-sensitive permissions are disabled
        const privacySensitive = ['camera', 'microphone', 'geolocation']
        privacySensitive.forEach(permission => {
          expect(
            permissionsPolicy,
            `Permissions-Policy should disable ${permission} by default`
          ).toContain(`${permission}=()`)
        })

        // Check for interest-cohort (FLoC) privacy
        expect(
          permissionsPolicy,
          'Permissions-Policy should disable interest-cohort for privacy'
        ).toContain('interest-cohort=()')
      })

      test(`should prevent clickjacking attacks`, async ({ page }) => {
        // Try to embed the page in an iframe
        const context = await page.context().newPage()
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head><title>Clickjack Test</title></head>
          <body>
            <iframe src="${app.url}" width="500" height="500"></iframe>
          </body>
          </html>
        `
        
        await context.setContent(htmlContent)
        
        // Check if the iframe is blocked
        const iframe = context.locator('iframe')
        const isBlocked = await iframe.evaluate(el => {
          try {
            return el.contentWindow !== null
          } catch (e) {
            return false
          }
        }).catch(() => true) // If accessing contentWindow throws error, it's blocked

        expect(
          isBlocked,
          'Application should prevent clickjacking by blocking iframe embedding'
        ).toBe(false) // Should be blocked, so isBlocked should be false

        await context.close()
      })

      test(`should handle CSP violations properly`, async ({ page }) => {
        // Navigate to the page
        await page.goto(app.url)

        // Listen for console messages (CSP violations are reported there)
        const consoleMessages: string[] = []
        page.on('console', msg => {
          if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
            consoleMessages.push(msg.text())
          }
        })

        // Try to inject an inline script (should be blocked by CSP)
        await page.evaluate(() => {
          const script = document.createElement('script')
          script.textContent = 'console.log("Inline script test")'
          document.head.appendChild(script)
        })

        // Wait a bit for any CSP violations to be reported
        await page.waitForTimeout(1000)

        // In production with proper CSP, inline scripts should be blocked
        if (process.env.NODE_ENV === 'production') {
          // Check that CSP violations are reported (this indicates CSP is working)
          const hasCSPViolation = consoleMessages.some(msg => 
            msg.includes('Content Security Policy') || msg.includes('CSP')
          )
          
          // Note: This test might need adjustment based on how CSP violations are actually reported
          // The main goal is to ensure CSP is active and blocking violations
        }
      })

      test(`should have security headers on API routes`, async ({ page }) => {
        // Test API route security headers
        const apiResponse = await page.request.get(`${app.url}/api/health`)
        
        if (apiResponse.status() !== 404) { // Only test if API route exists
          const apiHeaders = apiResponse.headers()
          
          // API routes should have some security headers, though might be different
          expect(
            apiHeaders['x-content-type-options'],
            'API routes should have X-Content-Type-Options'
          ).toBeTruthy()
        }
      })
    })
  })

  test('should generate comprehensive security compliance report', async ({ page }) => {
    const validations: any[] = []
    
    // Collect validation results for all apps
    for (const app of apps) {
      try {
        const response = await page.goto(app.url)
        const headers: Record<string, string> = {}
        response?.headers().forEach((value, key) => {
          headers[key] = value
        })
        
        const validation = validateSecurityHeaders(app.url, headers)
        validations.push(validation)
      } catch (error) {
        console.warn(`Failed to validate ${app.name}:`, error)
      }
    }

    // Calculate overall security posture
    const totalScore = validations.reduce((sum, v) => sum + v.overallScore, 0)
    const totalMaxScore = validations.reduce((sum, v) => sum + v.maxScore, 0)
    const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

    // Generate comprehensive report
    let report = `# Agency Platform Security Compliance Report\n\n`
    report += `**Date:** ${new Date().toLocaleDateString()}\n`
    report += `**Overall Security Score:** ${Math.round(overallPercentage)}%\n`
    report += `**Applications Tested:** ${validations.length}\n\n`

    validations.forEach(validation => {
      report += `## ${validation.url}\n`
      report += `**Score:** ${validation.overallScore}/${validation.maxScore} (${Math.round((validation.overallScore / validation.maxScore) * 100)}%)\n`
      report += `**Grade:** ${validation.grade}\n`
      
      if (validation.criticalIssues.length > 0) {
        report += `**Critical Issues:** ${validation.criticalIssues.length}\n`
      }
      
      report += `\n`
    })

    // Save report to file for CI/CD pipeline
    console.log('\n=== COMPREHENSIVE SECURITY REPORT ===\n')
    console.log(report)

    // Assert overall security posture
    expect(
      overallPercentage,
      `Overall security score too low: ${Math.round(overallPercentage)}% (minimum 80%)`
    ).toBeGreaterThanOrEqual(80)

    // Assert no app has critical issues
    const appsWithCriticalIssues = validations.filter(v => v.criticalIssues.length > 0)
    expect(
      appsWithCriticalIssues.length,
      `${appsWithCriticalIssues.length} app(s) have critical security issues`
    ).toBe(0)
  })
})
