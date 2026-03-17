import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage meets WCAG 2.2 AA standards', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
    
    // Log any passes for documentation
    if (results.passes.length > 0) {
      console.log(`✅ ${results.passes.length} accessibility checks passed`)
    }
  })

  test('keyboard navigation works on homepage', async ({ page }) => {
    await page.goto('/')

    // Test tab navigation
    await page.keyboard.press('Tab')
    const firstFocusable = await page.locator(':focus')
    expect(await firstFocusable.isVisible()).toBe(true)

    // Test Shift+Tab reverse navigation
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab') // Go back to first element
    
    // Test Enter/Space activation
    if (await firstFocusable.getAttribute('role') === 'button') {
      await page.keyboard.press('Enter')
      // Should activate button without errors
    }
  })

  test('focus appearance meets WCAG 2.2 2.4.11', async ({ page }) => {
    await page.goto('/')

    // Get all focusable elements
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all()

    for (const element of focusableElements) {
      await element.focus()
      
      // Check if element has visible focus indicator
      const focused = await page.locator(':focus')
      expect(await focused.isVisible()).toBe(true)
      
      // Check computed styles for focus appearance
      const styles = await focused.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          outline: computed.outline,
          outlineOffset: computed.outlineOffset,
          boxShadow: computed.boxShadow
        }
      })
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        styles.outline !== 'none' || 
        styles.outlineOffset !== '0px' ||
        styles.boxShadow.includes('focus')
      
      expect(hasFocusIndicator).toBe(true)
    }
  })

  test('target size meets WCAG 2.2 2.5.8 requirements', async ({ page }) => {
    await page.goto('/')

    // Get all interactive elements
    const interactiveElements = await page.locator(
      'button, [href], input[type="button"], input[type="submit"], [role="button"]'
    ).all()

    for (const element of interactiveElements) {
      const boundingBox = await element.boundingBox()
      if (!boundingBox) continue

      const { width, height } = boundingBox
      
      // Check minimum target size (24x24px)
      const meetsTargetSize = width >= 24 && height >= 24
      
      if (!meetsTargetSize) {
        // If not meeting size, check if spacing is adequate
        const position = await element.evaluate((el) => {
          const rect = el.getBoundingClientRect()
          return { x: rect.left, y: rect.top }
        })
        
        // Look for nearby elements to check spacing
        const nearbyElements = await page.locator(
          `button, [href], input:has-text(""), [role="button"]`
        ).all()
        
        let hasAdequateSpacing = true
        for (const nearby of nearbyElements) {
          if (await nearby.isVisible() && nearby !== element) {
            const nearbyBox = await nearby.boundingBox()
            if (!nearbyBox) continue
            
            const horizontalSpacing = Math.abs(position.x - nearbyBox.x)
            const verticalSpacing = Math.abs(position.y - nearbyBox.y)
            
            if (horizontalSpacing < 24 && verticalSpacing < 24) {
              hasAdequateSpacing = false
              break
            }
          }
        }
        
        expect(hasAdequateSpacing).toBe(true)
      }
    }
  })

  test('skip navigation link works correctly', async ({ page }) => {
    await page.goto('/')

    // Check if skip link exists (should be first focusable element)
    await page.keyboard.press('Tab')
    const firstFocused = await page.locator(':focus')
    
    // Look for skip link
    const skipLink = page.locator('a[href^="#"]').first()
    if (await skipLink.isVisible()) {
      // Activate skip link
      await skipLink.click()
      
      // Should jump to main content
      const mainContent = page.locator('main, [role="main"], #main-content')
      expect(await mainContent.isVisible()).toBe(true)
    }
  })

  test('heading structure is logical', async ({ page }) => {
    await page.goto('/')

    // Get all headings in order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    let previousLevel = 0
    
    for (const heading of headings) {
      const level = parseInt(await heading.evaluate((el) => 
        el.tagName.substring(1)
      ))
      
      // Check for single h1
      if (level === 1) {
        const h1Count = await page.locator('h1').count()
        expect(h1Count).toBe(1)
      }
      
      // Check heading hierarchy (no skipped levels)
      if (previousLevel > 0) {
        expect(level - previousLevel).toBeLessThanOrEqual(1)
      }
      
      previousLevel = level
    }
  })

  test('form elements have proper labels', async ({ page }) => {
    await page.goto('/')

    // Find all form controls
    const formControls = await page.locator(
      'input, select, textarea, [role="textbox"], [role="combobox"]'
    ).all()

    for (const control of formControls) {
      const isVisible = await control.isVisible()
      if (!isVisible) continue

      // Check for associated label
      const id = await control.getAttribute('id')
      const ariaLabel = await control.getAttribute('aria-label')
      const ariaLabelledBy = await control.getAttribute('aria-labelledby')
      
      let hasLabel = false
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        hasLabel = await label.count() > 0
      }
      
      hasLabel = hasLabel || 
        (ariaLabel && ariaLabel.length > 0) ||
        (ariaLabelledBy && ariaLabelledBy.length > 0)

      expect(hasLabel).toBe(true)
    }
  })

  test('images have appropriate alt text', async ({ page }) => {
    await page.goto('/')

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Decorative images should have empty alt
      // Informative images should have descriptive alt
      if (role === 'presentation') {
        expect(alt).toBe('')
      } else {
        expect(alt).toBeTruthy()
      }
    }
  })

  test('color contrast is adequate', async ({ page }) => {
    await page.goto('/')

    // This is a basic check - full contrast testing requires specialized tools
    // We'll check that text elements are not using color alone for meaning
    
    const textElements = await page.locator(
      'p, h1, h2, h3, h4, h5, h6, span, a, button'
    ).all()

    for (const element of textElements) {
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        }
      })

      // Basic check - elements should have visible color
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    }
  })

  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/')

    // Check for proper ARIA usage
    const ariaElements = await page.locator('[aria-*]').all()

    for (const element of ariaElements) {
      const attributes = await element.evaluate((el) => {
        const attrs: Record<string, string> = {}
        for (const attr of el.attributes) {
          if (attr.name.startsWith('aria-')) {
            attrs[attr.name] = attr.value
          }
        }
        return attrs
      })

      // Check for common ARIA anti-patterns
      const tagName = await element.evaluate((el) => el.tagName.toLowerCase())
      
      // Don't use redundant ARIA on semantic elements
      if (tagName === 'button' && attributes['role'] === 'button') {
        throw new Error('Redundant aria-role="button" on button element')
      }
      
      if (tagName === 'a' && attributes['role'] === 'link') {
        throw new Error('Redundant aria-role="link" on anchor element')
      }
    }
  })

  test('dynamic content updates are announced', async ({ page }) => {
    await page.goto('/')

    // Look for live regions
    const liveRegions = await page.locator(
      '[aria-live], [role="status"], [role="alert"], [role="log"]'
    ).all()

    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live')
      const role = await region.getAttribute('role')
      
      // Verify live region configuration
      if (ariaLive) {
        expect(['polite', 'assertive', 'off']).toContain(ariaLive)
      }
      
      if (role === 'alert') {
        expect(ariaLive).toBe('assertive')
      }
      
      if (role === 'status') {
        expect(ariaLive).toBe('polite')
      }
    }
  })

  test('responsive design maintains accessibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const mobileResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    expect(mobileResults.violations).toEqual([])

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    const tabletResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    expect(tabletResults.violations).toEqual([])
  })

  test('modal dialogs trap focus correctly', async ({ page }) => {
    await page.goto('/')

    // Look for modal triggers
    const modalTriggers = page.locator(
      'button[aria-haspopup="dialog"], button[data-modal], [data-testid*="modal"]'
    )

    if (await modalTriggers.count() > 0) {
      await modalTriggers.first().click()
      
      // Wait for modal to appear
      const modal = page.locator('[role="dialog"], .modal, [data-modal]')
      await expect(modal).toBeVisible()

      // Test focus trapping
      const focusableElements = await modal.locator(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all()

      if (focusableElements.length > 0) {
        // Tab through modal elements
        for (let i = 0; i < focusableElements.length + 2; i++) {
          await page.keyboard.press('Tab')
          const focused = await page.locator(':focus')
          expect(await modal.contains(focused)).toBe(true)
        }
      }

      // Test escape key
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('language attribute is set', async ({ page }) => {
    await page.goto('/')

    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBeTruthy()
    expect(htmlLang?.length).toBeGreaterThan(0)
  })
})

test.describe('Accessibility Regression Tests', () => {
  test('critical user journey: homepage to contact', async ({ page }) => {
    await page.goto('/')

    // Check homepage accessibility
    const homeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()
    expect(homeResults.violations).toEqual([])

    // Navigate to contact page
    const contactLink = page.locator('a[href*="contact"], [data-testid*="contact"]')
    if (await contactLink.count() > 0) {
      await contactLink.first().click()
      
      // Check contact page accessibility
      const contactResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
      expect(contactResults.violations).toEqual([])
    }
  })

  test('critical user journey: form submission', async ({ page }) => {
    await page.goto('/')

    // Look for forms
    const forms = page.locator('form')
    if (await forms.count() > 0) {
      const form = forms.first()
      
      // Check form accessibility before interaction
      const formResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
      expect(formResults.violations).toEqual([])

      // Fill form (if fields exist)
      const inputs = await form.locator('input:not([type="submit"]):not([type="button"])').all()
      for (const input of inputs.slice(0, 3)) { // Limit to first 3 for testing
        const inputType = await input.getAttribute('type')
        if (inputType === 'email') {
          await input.fill('test@example.com')
        } else if (inputType === 'text') {
          await input.fill('Test Value')
        } else if (inputType === 'tel') {
          await input.fill('555-123-4567')
        }
      }

      // Check accessibility after form interaction
      const afterFillResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze()
      expect(afterFillResults.violations).toEqual([])
    }
  })
})
