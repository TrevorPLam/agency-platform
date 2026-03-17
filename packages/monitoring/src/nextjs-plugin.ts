/**
 * Next.js plugin for performance budget enforcement
 * 
 * Integrates with the build process to check bundle sizes and performance budgets
 * Prevents performance regressions from reaching production
 */

import type { NextConfig } from 'next'
import type { BudgetValidationResult } from './performance-budgets'

/**
 * Performance budget plugin options
 */
interface PerformanceBudgetPluginOptions {
  /** Application name for budget configuration */
  appName: string
  /** Whether to fail the build on budget violations */
  failBuild?: boolean
  /** Custom budget configurations (overrides defaults) */
  customBudgets?: any[]
  /** Output directory for reports */
  outputDir?: string
}

/**
 * Create performance budget plugin
 */
export function withPerformanceBudget(
  nextConfig: NextConfig = {},
  options: PerformanceBudgetPluginOptions
): NextConfig {
  const {
    appName,
    failBuild = true,
    customBudgets,
    outputDir = '.next/performance-reports',
  } = options

  return {
    ...nextConfig,
    webpack: (config, { isServer, dev }) => {
      // Run existing webpack config
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, { isServer, dev })
      }

      // Skip performance checks in development
      if (dev || isServer) {
        return config
      }

      // Add performance budget validation plugin
      config.plugins.push(
        new PerformanceBudgetPlugin({
          appName,
          failBuild,
          customBudgets,
          outputDir,
        })
      )

      // Set performance budgets for webpack
      config.performance = {
        ...config.performance,
        maxEntrypointSize: 244000, // 244KB
        maxAssetSize: 244000,
        hints: failBuild ? 'warning' : false,
      }

      return config
    },
  }
}

/**
 * Webpack plugin for performance budget validation
 */
class PerformanceBudgetPlugin {
  private options: Required<Omit<PerformanceBudgetPluginOptions, 'customBudgets'>>

  constructor(options: PerformanceBudgetPluginOptions) {
    this.options = {
      appName: options.appName,
      failBuild: options.failBuild ?? true,
      outputDir: options.outputDir ?? '.next/performance-reports',
    }
  }

  apply(compiler: any): void {
    const pluginName = 'PerformanceBudgetPlugin'
    const fs = require('fs')
    const path = require('path')

    compiler.hooks.afterEmit.tapAsync(pluginName, (compilation: any, callback: () => void) => {
      try {
        const stats = compilation.getStats().toJson({
          assets: true,
          chunks: true,
          modules: true,
        })

        // Analyze bundle sizes
        const bundleAnalysis = this.analyzeBundles(stats)
        
        // Validate against budgets
        const validationResult = this.validateBundles(bundleAnalysis)

        // Generate report
        const report = this.generateReport(validationResult)
        
        // Save report
        this.saveReport(report, compilation.outputOptions.path)

        // Handle violations
        if (!validationResult.passed && this.options.failBuild) {
          const error = new Error('Performance budget violations detected')
          ;(error as any).details = validationResult.violations
          compilation.errors.push(error)
        } else if (!validationResult.passed) {
          console.warn('⚠️ Performance budget violations detected:')
          validationResult.violations.forEach(({ budget, actualValue }) => {
            console.warn(`  ${budget.name}: ${actualValue} > ${budget.threshold} ${budget.unit}`)
          })
        }

        if (validationResult.warnings.length > 0) {
          console.warn('⚠️ Performance budget warnings:')
          validationResult.warnings.forEach(({ message }) => {
            console.warn(`  ${message}`)
          })
        }

        callback()
      } catch (error) {
        console.error('Performance budget validation failed:', error)
        callback()
      }
    })
  }

  /**
   * Analyze webpack stats for bundle sizes
   */
  private analyzeBundles(stats: any): { bundleSize: number; imageSize: number } {
    let totalBundleSize = 0
    let totalImageSize = 0

    if (stats.assets) {
      stats.assets.forEach((asset: any) => {
        const size = asset.size || 0
        const name = asset.name || ''

        if (name.endsWith('.js') || name.endsWith('.css')) {
          totalBundleSize += size
        } else if (/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(name)) {
          totalImageSize += size
        }
      })
    }

    return {
      bundleSize: totalBundleSize,
      imageSize: totalImageSize,
    }
  }

  /**
   * Validate bundle analysis against performance budgets
   */
  private validateBundles(analysis: { bundleSize: number; imageSize: number }): BudgetValidationResult {
    // Import here to avoid circular dependencies
    const { getAppBudgets, validatePerformanceBudgets } = require('./performance-budgets')
    
    const budgets = getAppBudgets(this.options.appName as any)
    
    return validatePerformanceBudgets(
      {
        bundleSize: analysis.bundleSize,
        imageSize: analysis.imageSize,
      },
      budgets.map(b => ({ ...b, tenantId: this.options.appName, id: '', createdAt: '', updatedAt: '' }))
    )
  }

  /**
   * Generate performance budget report
   */
  private generateReport(result: BudgetValidationResult): string {
    const { generateBudgetReport } = require('./performance-budgets')
    return generateBudgetReport(result)
  }

  /**
   * Save report to file system
   */
  private saveReport(report: string, outputPath: string): void {
    const fs = require('fs')
    const path = require('path')
    
    const reportPath = path.join(outputPath, 'performance-budget-report.md')
    
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true })
      fs.writeFileSync(reportPath, report)
      console.log(`📊 Performance report saved to: ${reportPath}`)
    } catch (error) {
      console.error('Failed to save performance report:', error)
    }
  }
}

/**
 * Lighthouse performance budget integration
 */
export function createLighthouseBudgets(appName: string): any[] {
  const { getAppBudgets } = require('./performance-budgets')
  const budgets = getAppBudgets(appName as any)

  return budgets
    .filter(budget => ['lcp', 'inp', 'cls', 'fcp', 'ttfb'].includes(budget.category))
    .map(budget => {
      switch (budget.category) {
        case 'lcp':
          return {
            resourceType: 'document',
            budgetType: 'size',
            maximum: budget.threshold,
          }
        case 'inp':
          return {
            resourceType: 'script',
            budgetType: 'count',
            maximum: Math.floor(budget.threshold / 100), // Rough conversion
          }
        case 'cls':
          return {
            resourceType: 'document',
            budgetType: 'count',
            maximum: Math.floor(budget.threshold * 100), // Rough conversion
          }
        default:
          return null
      }
    })
    .filter(Boolean)
}

/**
 * Performance budget CLI utility
 */
export async function checkPerformanceBudgets(appName: string, buildPath: string): Promise<void> {
  const fs = require('fs').promises
  const path = require('path')
  
  try {
    // Read webpack stats
    const statsPath = path.join(buildPath, 'stats.json')
    const statsContent = await fs.readFile(statsPath, 'utf-8')
    const stats = JSON.parse(statsContent)

    // Analyze and validate
    const plugin = new PerformanceBudgetPlugin({ appName, failBuild: false, outputDir: buildPath })
    const analysis = plugin['analyzeBundles'](stats)
    const result = plugin['validateBundles'](analysis)

    // Output results
    console.log(plugin['generateReport'](result))

    // Set exit code for CI
    if (!result.passed) {
      process.exit(1)
    }
  } catch (error) {
    console.error('Failed to check performance budgets:', error)
    process.exit(1)
  }
}
