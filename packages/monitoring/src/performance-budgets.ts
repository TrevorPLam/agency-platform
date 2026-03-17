/**
 * Performance budget configuration for build-time enforcement
 * 
 * Defines performance thresholds and budget rules for the agency platform
 * Integrates with Next.js build process to prevent performance regressions
 */

import type { PerformanceBudget } from '@agency/monitoring/src/types'

/**
 * Default performance budgets for all applications
 */
export const DEFAULT_PERFORMANCE_BUDGETS: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>[] = [
  {
    name: 'LCP Budget - Good Performance',
    category: 'lcp',
    threshold: 2500,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'INP Budget - Responsive Interaction',
    category: 'inp',
    threshold: 200,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'CLS Budget - Visual Stability',
    category: 'cls',
    threshold: 0.1,
    unit: 'score',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
  {
    name: 'FCP Budget - Fast Loading',
    category: 'fcp',
    threshold: 1800,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'TTFB Budget - Server Response',
    category: 'ttfb',
    threshold: 800,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'JavaScript Bundle Size Budget',
    category: 'bundle-size',
    threshold: 244000, // 244KB
    unit: 'bytes',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
  {
    name: 'Image Size Budget',
    category: 'image-size',
    threshold: 500000, // 500KB
    unit: 'bytes',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
]

/**
 * Mobile-specific performance budgets (more lenient)
 */
export const MOBILE_PERFORMANCE_BUDGETS: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>[] = [
  {
    name: 'Mobile LCP Budget',
    category: 'lcp',
    threshold: 3000,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'Mobile INP Budget',
    category: 'inp',
    threshold: 300,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'medium',
  },
  {
    name: 'Mobile CLS Budget',
    category: 'cls',
    threshold: 0.15,
    unit: 'score',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
  {
    name: 'Mobile JavaScript Bundle Size Budget',
    category: 'bundle-size',
    threshold: 150000, // 150KB
    unit: 'bytes',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
]

/**
 * Strict performance budgets for production-critical applications
 */
export const STRICT_PERFORMANCE_BUDGETS: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>[] = [
  {
    name: 'Strict LCP Budget',
    category: 'lcp',
    threshold: 1500,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
  {
    name: 'Strict INP Budget',
    category: 'inp',
    threshold: 100,
    unit: 'milliseconds',
    type: 'maximum',
    active: true,
    alertSeverity: 'high',
  },
  {
    name: 'Strict CLS Budget',
    category: 'cls',
    threshold: 0.05,
    unit: 'score',
    type: 'maximum',
    active: true,
    alertSeverity: 'critical',
  },
  {
    name: 'Strict JavaScript Bundle Size Budget',
    category: 'bundle-size',
    threshold: 100000, // 100KB
    unit: 'bytes',
    type: 'maximum',
    active: true,
    alertSeverity: 'critical',
  },
]

/**
 * Application-specific budget configurations
 */
export const APP_BUDGET_CONFIGS = {
  'firm': {
    budgets: DEFAULT_PERFORMANCE_BUDGETS,
    strictMode: false,
  },
  'riley-day-care': {
    budgets: MOBILE_PERFORMANCE_BUDGETS,
    strictMode: false,
  },
  'the-barber-cave': {
    budgets: MOBILE_PERFORMANCE_BUDGETS,
    strictMode: false,
  },
  'agency-admin': {
    budgets: STRICT_PERFORMANCE_BUDGETS,
    strictMode: true,
  },
} as const

/**
 * Get performance budgets for a specific application
 */
export function getAppBudgets(appName: keyof typeof APP_BUDGET_CONFIGS): Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>[] {
  const config = APP_BUDGET_CONFIGS[appName]
  if (!config) {
    console.warn(`No budget configuration found for app: ${appName}, using defaults`)
    return DEFAULT_PERFORMANCE_BUDGETS
  }
  return config.budgets
}

/**
 * Performance budget validation result
 */
export interface BudgetValidationResult {
  passed: boolean
  violations: Array<{
    budget: PerformanceBudget
    actualValue: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
  warnings: Array<{
    budget: PerformanceBudget
    actualValue: number
    message: string
  }>
}

/**
 * Validate performance metrics against budgets
 */
export function validatePerformanceBudgets(
  metrics: {
    lcp?: number
    inp?: number
    cls?: number
    fcp?: number
    ttfb?: number
    bundleSize?: number
    imageSize?: number
  },
  budgets: PerformanceBudget[]
): BudgetValidationResult {
  const violations: BudgetValidationResult['violations'] = []
  const warnings: BudgetValidationResult['warnings'] = []

  budgets.forEach(budget => {
    let actualValue: number | undefined

    switch (budget.category) {
      case 'lcp': actualValue = metrics.lcp; break
      case 'inp': actualValue = metrics.inp; break
      case 'cls': actualValue = metrics.cls; break
      case 'fcp': actualValue = metrics.fcp; break
      case 'ttfb': actualValue = metrics.ttfb; break
      case 'bundle-size': actualValue = metrics.bundleSize; break
      case 'image-size': actualValue = metrics.imageSize; break
    }

    if (actualValue === undefined) return

    const isViolation = budget.type === 'maximum' ? actualValue > budget.threshold : actualValue < budget.threshold

    if (isViolation) {
      violations.push({
        budget,
        actualValue,
        severity: budget.alertSeverity,
      })
    } else if (budget.type === 'maximum' && actualValue > budget.threshold * 0.8) {
      // Warning when approaching threshold (80% of budget)
      warnings.push({
        budget,
        actualValue,
        message: `Approaching ${budget.name} threshold: ${actualValue} (${Math.round((actualValue / budget.threshold) * 100)}% of limit)`,
      })
    }
  })

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  }
}

/**
 * Generate performance budget report
 */
export function generateBudgetReport(result: BudgetValidationResult): string {
  const lines: string[] = []

  lines.push('# Performance Budget Report')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`)
  lines.push('')

  if (result.violations.length > 0) {
    lines.push('## Violations')
    result.violations.forEach(({ budget, actualValue, severity }) => {
      lines.push(`- **${budget.name}** (${severity})`)
      lines.push(`  - Expected: ≤ ${budget.threshold} ${budget.unit}`)
      lines.push(`  - Actual: ${actualValue} ${budget.unit}`)
      lines.push('')
    })
  }

  if (result.warnings.length > 0) {
    lines.push('## Warnings')
    result.warnings.forEach(({ budget, actualValue, message }) => {
      lines.push(`- **${budget.name}**`)
      lines.push(`  - ${message}`)
      lines.push('')
    })
  }

  if (result.passed && result.warnings.length === 0) {
    lines.push('✅ All performance budgets passed!')
  }

  return lines.join('\n')
}
