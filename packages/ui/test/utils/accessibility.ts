import { axe, toHaveNoViolations, AxeResults, Violation } from 'jest-axe'
import { expect } from 'vitest'
import { JSDOM } from 'jsdom'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

export interface AccessibilityTestOptions {
  level?: 'A' | 'AA' | 'AAA'
  tags?: string[]
  rules?: Record<string, any>
}

export interface AccessibilityTestResult {
  passed: boolean
  violations: Violation[]
  passes: any[]
  incomplete: any[]
  url?: string
}

/**
 * Test accessibility of HTML content using axe-core
 */
export async function testAccessibility(
  html: string,
  options: AccessibilityTestOptions = {}
): Promise<AccessibilityTestResult> {
  const defaultOptions: AccessibilityTestOptions = {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa'],
    rules: {},
  }

  const mergedOptions = { ...defaultOptions, ...options }

  try {
    // Create a DOM environment for testing
    const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
    global.document = dom.window.document
    global.window = dom.window as any

    const results = await axe(dom.window.document.body, mergedOptions)

    return {
      passed: results.violations.length === 0,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      url: results.url,
    }
  } catch (error) {
    console.error('Accessibility test error:', error)
    return {
      passed: false,
      violations: [],
      passes: [],
      incomplete: [],
    }
  }
}

/**
 * Expect no accessibility violations
 */
export async function expectNoViolations(html: string): Promise<void> {
  // Create a DOM environment for testing
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
  global.document = dom.window.document
  global.window = dom.window as any

  const results = await axe(dom.window.document.body)
  expect(results).toHaveNoViolations()
}

/**
 * Test WCAG 2.2 specific compliance
 */
export async function testWCAG22Compliance(
  html: string,
  criteria: string[]
): Promise<AccessibilityTestResult> {
  const wcag22Tags = ['wcag22aa', 'wcag2aa', 'wcag2a']

  // Map criteria to specific axe rules
  const criteriaRules: Record<string, string[]> = {
    TARGET_SIZE: ['target-size'],
    FOCUS_APPEARANCE: ['focus-visible-enhanced'],
    // Add more WCAG 2.2 specific mappings as needed
  }

  let rules: Record<string, any> = {}

  criteria.forEach(criterion => {
    if (criteriaRules[criterion]) {
      criteriaRules[criterion].forEach(rule => {
        rules[rule] = { enabled: true }
      })
    }
  })

  return testAccessibility(html, {
    level: 'AA',
    tags: wcag22Tags,
    rules,
  })
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(html: string): boolean {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
  const element = dom.window.document.body.firstChild as HTMLElement

  if (!element) return false

  // Basic checks for keyboard accessibility
  const hasTabIndex = element.hasAttribute('tabindex')
  const isFocusableElement = [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].some(selector => {
    try {
      return element.matches?.(selector)
    } catch {
      return false
    }
  })

  return hasTabIndex || isFocusableElement
}

/**
 * Test focus visibility
 */
export function testFocusVisibility(html: string): boolean {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
  const element = dom.window.document.body.firstChild as HTMLElement

  if (!element) return false

  // Check for focus-related classes or styles
  const className = element.className || ''
  const hasFocusStyles =
    className.includes('focus') ||
    className.includes('ring')

  return hasFocusStyles
}

/**
 * Test target size (WCAG 2.2 2.5.8)
 */
export function testTargetSize(html: string): boolean {
  // For HTML strings, we can't easily measure actual size
  // This would require rendering in a browser environment
  // Return true for now as a placeholder
  return true
}

/**
 * Test ARIA attributes
 */
export function testAriaAttributes(html: string): {
  hasValidAria: boolean
  issues: string[]
} {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`)
  const element = dom.window.document.body.firstChild as HTMLElement

  if (!element) {
    return { hasValidAria: false, issues: ['Element not found'] }
  }

  const issues: string[] = []

  // Check for common ARIA issues
  if (element.hasAttribute('aria-label') && element.hasAttribute('aria-labelledby')) {
    issues.push('Element has both aria-label and aria-labelledby')
  }

  if (element.getAttribute('role') === 'button' && element.tagName !== 'BUTTON') {
    if (!element.hasAttribute('tabindex')) {
      issues.push('Non-button element with button role missing tabindex')
    }
  }

  return {
    hasValidAria: issues.length === 0,
    issues,
  }
}
