import { test, expect } from '@playwright/test'
import { validateCSP, generateCSPReport, meetsMinimumCSPRequirements } from '@agency/security'

test.describe('Content Security Policy Compliance', () => {
  const apps = [
    { name: 'Firm', url: 'http://localhost:3000', port: 3000 },
    { name: 'Agency Admin', url: 'http://localhost:3001', port: 3001 },
    { name: 'Riley Day Care', url: 'http://localhost:3002', port: 3002 },
    { name: 'The Barber Cave', url: 'http://localhost:3003', port: 3003 }
  ]

  apps.forEach(app => {
    test.describe(`${app.name} CSP Validation`, () => {
      test('should have comprehensive CSP policy', async ({ page }) => {
        const response = await page.goto(app.url)
        expect(response).toBeTruthy()
        
        const cspHeader = response?.headers()['content-security-policy']
        expect(
          cspHeader,
          'Content-Security-Policy header is required'
        ).toBeTruthy()

        const validation = validateCSP(cspHeader!)
        const report = generateCSPReport(validation)
        
        console.log(`\n=== ${app.name} CSP Report ===\n`)
        console.log(report)

        // Assert minimum CSP requirements
        expect(
          meetsMinimumCSPRequirements(validation),
          `CSP does not meet minimum requirements for ${app.name}. Critical issues: ${validation.criticalIssues.join(', ')}`
        ).toBe(true)

        // Assert no critical CSP issues
        expect(
          validation.criticalIssues.length,
          `Critical CSP issues found: ${validation.criticalIssues.join(', ')}`
        ).toBe(0)

        // Assert minimum score threshold
        const scorePercentage = (validation.overallScore / validation.maxScore) * 100
        expect(
          scorePercentage,
          `CSP score too low: ${scorePercentage}% (minimum 70%)`
        ).toBeGreaterThanOrEqual(70)

        // Assert nonce-based policy
        expect(
          validation.nonceBased,
          'CSP should use nonce-based policy for dynamic content'
        ).toBe(true)
      })

      test('should have proper script-src directive', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        const scriptSrc = validation.directives.find(d => d.name === 'script-src')
        expect(scriptSrc, 'script-src directive is required').toBeTruthy()

        // Check for nonce or hash-based policy
        const hasNonce = scriptSrc!.values.some(v => v.startsWith('nonce-'))
        const hasHash = scriptSrc!.values.some(v => v.startsWith('sha256-') || v.startsWith('sha384-') || v.startsWith('sha512-'))
        
        expect(
          hasNonce || hasHash,
          'script-src should use nonce or hash-based policy'
        ).toBe(true)

        // Should not have unsafe-inline when nonce/hash is used
        if (hasNonce || hasHash) {
          expect(
            scriptSrc!.values.includes("'unsafe-inline'"),
            'script-src should not have unsafe-inline when using nonce/hash'
        ).toBe(false)
        }

        // Should not have unsafe-eval
        expect(
          scriptSrc!.values.includes("'unsafe-eval'"),
          'script-src should not include unsafe-eval'
        ).toBe(false)

        // Should include self
        expect(
          scriptSrc!.values.includes("'self'"),
          'script-src should include self'
        ).toBe(true)
      })

      test('should have proper style-src directive', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        const styleSrc = validation.directives.find(d => d.name === 'style-src')
        expect(styleSrc, 'style-src directive is required').toBeTruthy()

        // Should include self
        expect(
          styleSrc!.values.includes("'self'"),
          'style-src should include self'
        ).toBe(true)

        // Check for nonce or hash-based policy or unsafe-inline
        const hasNonce = styleSrc!.values.some(v => v.startsWith('nonce-'))
        const hasHash = styleSrc!.values.some(v => v.startsWith('sha256-') || v.startsWith('sha384-') || v.startsWith('sha512-'))
        const hasUnsafeInline = styleSrc!.values.includes("'unsafe-inline'")
        
        expect(
          hasNonce || hasHash || hasUnsafeInline,
          'style-src should use nonce, hash, or unsafe-inline for dynamic styles'
        ).toBe(true)
      })

      test('should have proper default-src directive', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        const defaultSrc = validation.directives.find(d => d.name === 'default-src')
        expect(defaultSrc, 'default-src directive is required').toBeTruthy()

        // Should include self or none
        expect(
          defaultSrc!.values.includes("'self'") || defaultSrc!.values.includes("'none'"),
          'default-src should include self or none'
        ).toBe(true)

        // Should not have wildcard
        expect(
          defaultSrc!.values.includes("*"),
          'default-src should not use wildcard'
        ).toBe(false)
      })

      test('should have proper frame-ancestors directive', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        const frameAncestors = validation.directives.find(d => d.name === 'frame-ancestors')
        expect(frameAncestors, 'frame-ancestors directive is required').toBeTruthy()

        // Should be set to none
        expect(
          frameAncestors!.values.includes("'none'"),
          'frame-ancestors should be set to none'
        ).toBe(true)
      })

      test('should have proper connect-src directive', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        const connectSrc = validation.directives.find(d => d.name === 'connect-src')
        expect(connectSrc, 'connect-src directive is required').toBeTruthy()

        // Should include self
        expect(
          connectSrc!.values.includes("'self'"),
          'connect-src should include self'
        ).toBe(true)

        // Should include analytics domains
        const hasAnalytics = connectSrc!.values.some(v => 
          v.includes('posthog.com') || 
          v.includes('google-analytics.com') ||
          v.includes('googletagmanager.com')
        )
        
        // Note: This might not apply to all apps, so we'll just log it
        if (!hasAnalytics) {
          console.log(`Note: ${app.name} connect-src does not include analytics domains`)
        }
      })

      test('should block inline script execution', async ({ page }) => {
        await page.goto(app.url)

        // Try to execute an inline script
        const result = await page.evaluate(() => {
          try {
            const script = document.createElement('script')
            script.textContent = 'window.__inlineScriptTest = true;'
            document.head.appendChild(script)
            return window.__inlineScriptTest === true
          } catch (e) {
            return false
          }
        })

        // In production with proper CSP, this should be blocked
        if (process.env.NODE_ENV === 'production') {
          expect(
            result,
            'Inline script execution should be blocked by CSP'
          ).toBe(false)
        }
      })

      test('should block unsafe eval', async ({ page }) => {
        await page.goto(app.url)

        // Try to use eval
        const result = await page.evaluate(() => {
          try {
            const result = eval('1 + 1')
            return result === 2
          } catch (e) {
            return false
          }
        })

        // In production with proper CSP, this should be blocked
        if (process.env.NODE_ENV === 'production') {
          expect(
            result,
            'eval() should be blocked by CSP'
          ).toBe(false)
        }
      })

      test('should allow nonce-based scripts', async ({ page }) => {
        await page.goto(app.url)

        // Get the nonce from the page headers
        const nonce = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="csp-nonce"]')
          return meta?.getAttribute('content') || null
        })

        if (nonce) {
          // Try to execute a script with the correct nonce
          const result = await page.evaluate((nonceValue) => {
            try {
              const script = document.createElement('script')
              script.setAttribute('nonce', nonceValue)
              script.textContent = 'window.__nonceScriptTest = true;'
              document.head.appendChild(script)
              return window.__nonceScriptTest === true
            } catch (e) {
              return false
            }
          }, nonce)

          expect(
            result,
            'Nonce-based script execution should be allowed by CSP'
          ).toBe(true)
        }
      })

      test('should have CSP violation reporting', async ({ page }) => {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        const validation = validateCSP(cspHeader!)
        
        // Check for report-uri or report-to directive
        expect(
          validation.reportUri,
          'CSP should include report-uri for violation monitoring'
        ).toBeTruthy()
      })
    })
  })

  test('should generate comprehensive CSP compliance report', async ({ page }) => {
    const validations: any[] = []
    
    // Collect CSP validation results for all apps
    for (const app of apps) {
      try {
        const response = await page.goto(app.url)
        const cspHeader = response?.headers()['content-security-policy']
        
        if (cspHeader) {
          const validation = validateCSP(cspHeader)
          validations.push({ app: app.name, validation })
        }
      } catch (error) {
        console.warn(`Failed to validate CSP for ${app.name}:`, error)
      }
    }

    // Calculate overall CSP compliance
    const totalScore = validations.reduce((sum, v) => sum + v.validation.overallScore, 0)
    const totalMaxScore = validations.reduce((sum, v) => sum + v.validation.maxScore, 0)
    const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

    // Count nonce-based policies
    const nonceBasedCount = validations.filter(v => v.validation.nonceBased).length

    // Generate comprehensive report
    let report = `# Agency Platform CSP Compliance Report\n\n`
    report += `**Date:** ${new Date().toLocaleDateString()}\n`
    report += `**Overall CSP Score:** ${Math.round(overallPercentage)}%\n`
    report += `**Applications with Nonce-based CSP:** ${nonceBasedCount}/${validations.length}\n\n`

    validations.forEach(({ app, validation }) => {
      report += `## ${app}\n`
      report += `**Score:** ${validation.overallScore}/${validation.maxScore} (${Math.round((validation.overallScore / validation.maxScore) * 100)}%)\n`
      report += `**Grade:** ${validation.grade}\n`
      report += `**Nonce-based:** ${validation.nonceBased ? 'Yes ✅' : 'No ⚠️'}\n`
      
      if (validation.criticalIssues.length > 0) {
        report += `**Critical Issues:** ${validation.criticalIssues.length}\n`
      }
      
      report += `\n`
    })

    console.log('\n=== COMPREHENSIVE CSP REPORT ===\n')
    console.log(report)

    // Assert overall CSP compliance
    expect(
      overallPercentage,
      `Overall CSP score too low: ${Math.round(overallPercentage)}% (minimum 80%)`
    ).toBeGreaterThanOrEqual(80)

    // Assert all apps use nonce-based CSP
    expect(
      nonceBasedCount,
      `All apps should use nonce-based CSP: ${nonceBasedCount}/${validations.length}`
    ).toBe(validations.length)

    // Assert no app has critical CSP issues
    const appsWithCriticalIssues = validations.filter(v => v.validation.criticalIssues.length > 0)
    expect(
      appsWithCriticalIssues.length,
      `${appsWithCriticalIssues.length} app(s) have critical CSP issues`
    ).toBe(0)
  })
})
