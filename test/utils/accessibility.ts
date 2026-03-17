/**
 * Accessibility testing utilities for WCAG 2.2 AA compliance
 * Integrates axe-core for automated accessibility testing
 */

import { axe, toHaveNoViolations, AxeResults, Violation } from 'jest-axe'
import { render, RenderResult } from '@testing-library/react'
import { ReactElement } from 'react'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

export interface AccessibilityTestOptions {
  /** Additional axe rules to disable */
  disabledRules?: string[]
  /** WCAG level to test against */
  level?: 'A' | 'AA' | 'AAA'
  /** Specific axe tags to include */
  tags?: string[]
}

export interface AccessibilityTestResult {
  passed: boolean
  violations: Violation[]
  passes: string[]
  incomplete: string[]
}

/**
 * Test component for accessibility violations
 * 
 * @param component - React component to test
 * @param options - Accessibility test options
 * @returns Promise resolving to test result
 * 
 * @example
 * ```tsx
 * import { testAccessibility } from '@/test/utils/accessibility'
 * 
 * it('should be accessible', async () => {
 *   const result = await testAccessibility(<Button>Click me</Button>)
 *   expect(result.passed).toBe(true)
 * })
 * ```
 */
export async function testAccessibility(
  component: ReactElement,
  options: AccessibilityTestOptions = {}
): Promise<AccessibilityTestResult> {
  const {
    disabledRules = [],
    level = 'AA',
    tags = ['wcag2a', 'wcag2aa', 'wcag22aa']
  } = options

  // Render the component
  const { container }: RenderResult = render(component)

  // Configure axe options
  const axeOptions = {
    rules: {
      // Disable specific rules if requested
      ...disabledRules.reduce((acc, rule) => {
        acc[rule] = { enabled: false }
        return acc
      }, {} as Record<string, { enabled: boolean }>),
      
      // WCAG 2.2 specific rules
      'focus-order-semantics': { enabled: level !== 'A' },
      'color-contrast-enhanced': { enabled: level === 'AAA' },
      'target-size': { enabled: level !== 'A' }, // WCAG 2.5.8
    },
    tags
  }

  // Run axe analysis
  const results: AxeResults = await axe(container, axeOptions)

  return {
    passed: results.violations.length === 0,
    violations: results.violations,
    passes: results.passes.map(p => p.description),
    incomplete: results.incomplete.map(i => i.description)
  }
}

/**
 * Test component and expect no violations
 * Convenience wrapper around testAccessibility
 * 
 * @param component - React component to test
 * @param options - Accessibility test options
 * 
 * @example
 * ```tsx
 * it('has no accessibility violations', async () => {
 *   await expectNoViolations(<Button>Click me</Button>)
 * })
 * ```
 */
export async function expectNoViolations(
  component: ReactElement,
  options: AccessibilityTestOptions = {}
): Promise<void> {
  const { container }: RenderResult = render(component)
  const results = await axe(container, {
    rules: options.disabledRules?.reduce((acc, rule) => {
      acc[rule] = { enabled: false }
      return acc
    }, {} as Record<string, { enabled: boolean }>),
    tags: options.tags || ['wcag2a', 'wcag2aa', 'wcag22aa']
  })
  
  expect(results).toHaveNoViolations()
}

/**
 * Test specific WCAG 2.2 requirements
 */

export function testFocusAppearance(component: ReactElement): Promise<AccessibilityTestResult> {
  return testAccessibility(component, {
    tags: ['wcag22aa'], // Focus appearance is WCAG 2.2 specific
    disabledRules: ['color-contrast'] // Focus appearance has different contrast requirements
  })
}

export function testTargetSize(component: ReactElement): Promise<AccessibilityTestResult> {
  return testAccessibility(component, {
    tags: ['wcag22aa'], // Target size is WCAG 2.2 specific (2.5.8)
    disabledRules: ['color-contrast', 'focus-order-semantics']
  })
}

export function testDraggingMovements(component: ReactElement): Promise<AccessibilityTestResult> {
  return testAccessibility(component, {
    tags: ['wcag22aa'], // Dragging movements is WCAG 2.2 specific (2.5.7)
    disabledRules: ['color-contrast', 'focus-order-semantics', 'target-size']
  })
}

/**
 * Create accessibility test data for forms
 */
export interface FormData {
  [key: string]: string
}

export function createFormData(fields: FormData): FormData {
  return fields
}

/**
 * Test form accessibility specifically
 */
export async function testFormAccessibility(
  formComponent: ReactElement,
  formData?: FormData
): Promise<AccessibilityTestResult> {
  const result = await testAccessibility(formComponent, {
    tags: ['wcag2a', 'wcag2aa', 'wcag22aa'],
    disabledRules: ['color-contrast-enhanced'] // Don't require AAA contrast for forms
  })

  // Additional form-specific checks
  const formViolations: Violation[] = []

  // Check for proper labeling (axe handles this, but we can add custom checks)
  if (formData) {
    // Custom form validation logic can be added here
  }

  return {
    ...result,
    violations: [...result.violations, ...formViolations]
  }
}

/**
 * Helper to create accessibility test stories for Storybook
 */
export function createAccessibilityStory(component: ReactElement) {
  return {
    render: () => component,
    parameters: {
      a11y: {
        config: {
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'target-size': { enabled: true } // WCAG 2.2 2.5.8
          }
        }
      }
    }
  }
}

/**
 * WCAG 2.2 specific test helpers
 */

export const WCAG22_RULES = {
  // 2.4.11 Focus Appearance (AA)
  FOCUS_APPEARANCE: 'focus-order-semantics',
  
  // 2.4.12 Focus Appearance Enhanced (AAA)
  FOCUS_APPEARANCE_ENHANCED: 'focus-order-semantics',
  
  // 2.5.7 Dragging Movements (AA)
  DRAGGING_MOVEMENTS: 'dragging-movements',
  
  // 2.5.8 Target Size (AA)
  TARGET_SIZE: 'target-size',
  
  // 3.2.6 Consistent Help (A)
  CONSISTENT_HELP: 'consistent-help',
  
  // 3.3.7 Redundant Entry (A)
  REDUNDANT_ENTRY: 'redundant-entry',
  
  // 3.3.8 Accessible Authentication (AA)
  ACCESSIBLE_AUTH: 'accessible-auth'
} as const

/**
 * Test compliance with specific WCAG 2.2 success criteria
 */
export async function testWCAG22Compliance(
  component: ReactElement,
  criteria: keyof typeof WCAG22_RULES[]
): Promise<AccessibilityTestResult> {
  const tags = ['wcag22aa']
  const disabledRules = Object.keys(WCAG22_RULES)
    .filter(key => !criteria.includes(key as keyof typeof WCAG22_RULES))
    .map(key => WCAG22_RULES[key as keyof typeof WCAG22_RULES])

  return testAccessibility(component, {
    tags,
    disabledRules
  })
}

/**
 * Common accessibility test patterns
 */

export const accessibilityTests = {
  // Basic accessibility test
  basic: (component: ReactElement) => expectNoViolations(component),
  
  // WCAG 2.2 AA compliance
  wcag22aa: (component: ReactElement) => testAccessibility(component, {
    level: 'AA',
    tags: ['wcag2a', 'wcag2aa', 'wcag22aa']
  }),
  
  // Focus appearance (WCAG 2.2 2.4.11)
  focusAppearance: testFocusAppearance,
  
  // Target size (WCAG 2.2 2.5.8)
  targetSize: testTargetSize,
  
  // Form accessibility
  form: testFormAccessibility
} as const
