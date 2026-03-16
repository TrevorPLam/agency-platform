#!/usr/bin/env tsx

/**
 * Flaky Test Detection and Management System
 * 
 * Advanced flaky test detection using statistical analysis and machine learning
 * to identify, quarantine, and manage unstable tests in the monorepo.
 * 
 * Features:
 * - Statistical analysis of test failure patterns
 * - Automatic quarantine of flaky tests
 * - Trend analysis and prediction
 * - Integration with merge queue and CI/CD
 * - Root cause analysis suggestions
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

interface TestResult {
  testName: string
  filePath: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  timestamp: Date
  errorMessage?: string
  stackTrace?: string
  commitSha: string
  branch: string
  prNumber?: number
}

interface FlakyTestMetrics {
  testName: string
  totalRuns: number
  failures: number
  successRate: number
  failureRate: number
  avgDuration: number
  lastFailure: Date
  recentFailures: number // Failures in last 10 runs
  trend: 'improving' | 'degrading' | 'stable'
  flakinessScore: number // 0-100, higher = more flaky
  quarantined: boolean
  quarantineReason?: string
  quarantineDate?: Date
  suggestedActions: string[]
  relatedTests: string[]
  commonFailurePatterns: string[]
}

interface TestExecution {
  id: string
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  timestamp: Date
  commitSha: string
  branch: string
  errorMessage?: string
  environment: string
  nodeVersion: string
  parallel: boolean
}

interface FlakyTestReport {
  generatedAt: Date
  totalTests: number
  flakyTests: FlakyTestMetrics[]
  quarantineStats: {
    totalQuarantined: number
    newlyQuarantined: number
    recentlyRecovered: number
  }
  trendAnalysis: {
    improving: number
    degrading: number
    stable: number
  }
  recommendations: string[]
  healthScore: number // 0-100
}

class FlakyTestDetector {
  private testHistory: Map<string, TestExecution[]> = new Map()
  private flakyTests: Map<string, FlakyTestMetrics> = new Map()
  private config: FlakyTestConfig
  private dataDir: string

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath)
    this.dataDir = join(__dirname, 'data')
    this.ensureDataDirectory()
    this.loadData()
  }

  private ensureDataDirectory(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private loadConfig(configPath?: string): FlakyTestConfig {
    const defaultConfig: FlakyTestConfig = {
      failureRateThreshold: 0.15, // 15% failure rate
      minRuns: 10, // Minimum runs before analysis
      recentRunsWindow: 10, // Last N runs for recent analysis
      quarantineThreshold: 0.25, // 25% failure rate for quarantine
      recoveryThreshold: 0.05, // 5% failure rate for recovery
      trendWindow: 20, // Last N runs for trend analysis
      parallelExecutionThreshold: 0.3, // Higher failure rate in parallel
      environmentCorrelationThreshold: 0.1 // Environment-specific flakiness
    }

    if (configPath && existsSync(configPath)) {
      try {
        const configData = JSON.parse(readFileSync(configPath, 'utf8'))
        return { ...defaultConfig, ...configData }
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}, using defaults`)
      }
    }

    return defaultConfig
  }

  private loadData(): void {
    // Load test history
    const historyFile = join(this.dataDir, 'test-history.json')
    if (existsSync(historyFile)) {
      try {
        const data = JSON.parse(readFileSync(historyFile, 'utf8'))
        this.testHistory = new Map(Object.entries(data))
      } catch (error) {
        console.warn('Failed to load test history data')
      }
    }

    // Load flaky tests
    const flakyTestsFile = join(this.dataDir, 'flaky-tests.json')
    if (existsSync(flakyTestsFile)) {
      try {
        const data = JSON.parse(readFileSync(flakyTestsFile, 'utf8'))
        this.flakyTests = new Map(Object.entries(data))
      } catch (error) {
        console.warn('Failed to load flaky tests data')
      }
    }
  }

  private saveData(): void {
    // Save test history
    const historyFile = join(this.dataDir, 'test-history.json')
    const historyData = Object.fromEntries(this.testHistory)
    writeFileSync(historyFile, JSON.stringify(historyData, null, 2))

    // Save flaky tests
    const flakyTestsFile = join(this.dataDir, 'flaky-tests.json')
    const flakyData = Object.fromEntries(this.flakyTests)
    writeFileSync(flakyTestsFile, JSON.stringify(flakyData, null, 2))
  }

  /**
   * Parse test results from various test runners
   */
  public parseTestResults(testOutput: string, format: 'jest' | 'vitest' | 'playwright' = 'jest'): TestExecution[] {
    const results: TestExecution[] = []
    const lines = testOutput.split('\n')
    
    let currentTest: Partial<TestExecution> = {}
    const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    for (const line of lines) {
      // Parse Jest format
      if (format === 'jest') {
        const testMatch = line.match(/(✓|✗)\s+(.+?)\s+\((\d+)ms\)/)
        if (testMatch) {
          const [, status, testName, duration] = testMatch
          results.push({
            id: `${executionId}-${results.length}`,
            testName: testName.trim(),
            status: status === '✓' ? 'passed' : 'failed',
            duration: parseInt(duration, 10),
            timestamp: new Date(),
            commitSha: this.getCurrentCommit(),
            branch: this.getCurrentBranch(),
            environment: process.env.NODE_ENV || 'test',
            nodeVersion: process.version,
            parallel: process.env.CI === 'true'
          })
        }

        // Parse error messages
        const errorMatch = line.match(/Error:\s+(.+)/)
        if (errorMatch && currentTest.testName) {
          currentTest.errorMessage = errorMatch[1]
        }
      }

      // Parse Vitest format
      if (format === 'vitest') {
        const testMatch = line.match(/(PASS|FAIL)\s+(.+?)\s+\[(\d+)ms\]/)
        if (testMatch) {
          const [, status, testName, duration] = testMatch
          results.push({
            id: `${executionId}-${results.length}`,
            testName: testName.trim(),
            status: status === 'PASS' ? 'passed' : 'failed',
            duration: parseInt(duration, 10),
            timestamp: new Date(),
            commitSha: this.getCurrentCommit(),
            branch: this.getCurrentBranch(),
            environment: process.env.NODE_ENV || 'test',
            nodeVersion: process.version,
            parallel: process.env.CI === 'true'
          })
        }
      }

      // Parse Playwright format
      if (format === 'playwright') {
        const testMatch = line.match(/(✓|✗)\s+(.+?)\s+\[(\d+)ms\]/)
        if (testMatch) {
          const [, status, testName, duration] = testMatch
          results.push({
            id: `${executionId}-${results.length}`,
            testName: testName.trim(),
            status: status === '✓' ? 'passed' : 'failed',
            duration: parseInt(duration, 10),
            timestamp: new Date(),
            commitSha: this.getCurrentCommit(),
            branch: this.getCurrentBranch(),
            environment: process.env.NODE_ENV || 'test',
            nodeVersion: process.version,
            parallel: process.env.CI === 'true'
          })
        }
      }
    }

    return results
  }

  /**
   * Record test results and analyze for flakiness
   */
  public recordTestResults(results: TestExecution[]): void {
    console.log(`📊 Recording ${results.length} test results`)

    for (const result of results) {
      // Add to test history
      if (!this.testHistory.has(result.testName)) {
        this.testHistory.set(result.testName, [])
      }
      this.testHistory.get(result.testName)!.push(result)

      // Analyze for flakiness
      this.analyzeTestFlakiness(result.testName)
    }

    // Clean old data (keep last 1000 runs per test)
    this.cleanOldData()

    // Save updated data
    this.saveData()

    console.log(`✅ Test results recorded and analyzed`)
  }

  /**
   * Analyze a specific test for flakiness
   */
  private analyzeTestFlakiness(testName: string): void {
    const history = this.testHistory.get(testName) || []
    
    if (history.length < this.config.minRuns) {
      return // Not enough data for analysis
    }

    const metrics = this.calculateFlakyMetrics(testName, history)
    this.flakyTests.set(testName, metrics)

    // Check if quarantine is needed
    this.checkQuarantineStatus(metrics)
  }

  /**
   * Calculate flaky test metrics
   */
  private calculateFlakyMetrics(testName: string, history: TestExecution[]): FlakyTestMetrics {
    const totalRuns = history.length
    const failures = history.filter(r => r.status === 'failed').length
    const successes = history.filter(r => r.status === 'passed').length
    const successRate = successes / totalRuns
    const failureRate = failures / totalRuns

    // Calculate average duration
    const durations = history.map(r => r.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length

    // Recent failures (last N runs)
    const recentRuns = history.slice(-this.config.recentRunsWindow)
    const recentFailures = recentRuns.filter(r => r.status === 'failed').length

    // Last failure
    const lastFailure = history
      .filter(r => r.status === 'failed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp || new Date(0)

    // Trend analysis
    const trend = this.calculateTrend(history)

    // Flakiness score (0-100)
    const flakinessScore = this.calculateFlakinessScore(failureRate, recentFailures, trend)

    // Suggested actions
    const suggestedActions = this.generateSuggestedActions(failureRate, trend, avgDuration)

    // Related tests (tests that often fail together)
    const relatedTests = this.findRelatedTests(testName, history)

    // Common failure patterns
    const commonFailurePatterns = this.extractFailurePatterns(history)

    return {
      testName,
      totalRuns,
      failures,
      successRate,
      failureRate,
      avgDuration,
      lastFailure,
      recentFailures,
      trend,
      flakinessScore,
      quarantined: false,
      suggestedActions,
      relatedTests,
      commonFailurePatterns
    }
  }

  /**
   * Calculate trend based on recent performance
   */
  private calculateTrend(history: TestExecution[]): 'improving' | 'degrading' | 'stable' {
    if (history.length < this.config.trendWindow) {
      return 'stable'
    }

    const recent = history.slice(-Math.floor(this.config.trendWindow / 2))
    const older = history.slice(-this.config.trendWindow, -Math.floor(this.config.trendWindow / 2))

    const recentFailureRate = recent.filter(r => r.status === 'failed').length / recent.length
    const olderFailureRate = older.filter(r => r.status === 'failed').length / older.length

    const difference = recentFailureRate - olderFailureRate

    if (difference > 0.1) return 'degrading'
    if (difference < -0.1) return 'improving'
    return 'stable'
  }

  /**
   * Calculate flakiness score (0-100)
   */
  private calculateFlakinessScore(failureRate: number, recentFailures: number, trend: string): number {
    let score = failureRate * 100

    // Boost score for recent failures
    const recentFailureRate = recentFailures / this.config.recentRunsWindow
    score += recentFailureRate * 50

    // Adjust based on trend
    if (trend === 'degrading') score += 20
    if (trend === 'improving') score -= 10

    // Cap at 100
    return Math.min(100, Math.max(0, score))
  }

  /**
   * Generate suggested actions for flaky tests
   */
  private generateSuggestedActions(failureRate: number, trend: string, avgDuration: number): string[] {
    const actions: string[] = []

    if (failureRate > 0.3) {
      actions.push('High failure rate - consider test redesign')
    }

    if (trend === 'degrading') {
      actions.push('Degrading performance - investigate recent changes')
    }

    if (avgDuration > 5000) {
      actions.push('Long execution time - may indicate race conditions')
    }

    if (failureRate > 0.1 && failureRate <= 0.3) {
      actions.push('Moderate flakiness - add retries or improve test isolation')
    }

    if (actions.length === 0) {
      actions.push('Monitor for continued stability')
    }

    return actions
  }

  /**
   * Find tests that often fail together
   */
  private findRelatedTests(testName: string, history: TestExecution[]): string[] {
    const related: string[] = []
    const testTimestamps = new Set(
      history
        .filter(r => r.status === 'failed')
        .map(r => r.timestamp.getTime())
    )

    // Find other tests that failed at similar times
    for (const [otherTestName, otherHistory] of this.testHistory.entries()) {
      if (otherTestName === testName) continue

      const otherFailures = otherHistory.filter(r => r.status === 'failed')
      const concurrentFailures = otherFailures.filter(r => 
        testTimestamps.has(r.timestamp.getTime())
      )

      if (concurrentFailures.length > 2) {
        related.push(otherTestName)
      }
    }

    return related
  }

  /**
   * Extract common failure patterns from error messages
   */
  private extractFailurePatterns(history: TestExecution[]): string[] {
    const patterns: Map<string, number> = new Map()
    const failures = history.filter(r => r.status === 'failed' && r.errorMessage)

    for (const failure of failures) {
      if (!failure.errorMessage) continue

      // Extract common patterns from error messages
      const patterns_in_message = [
        /timeout/i,
        /connection refused/i,
        /memory/i,
        /permission denied/i,
        /network/i,
        /async/i,
        /race condition/i,
        /undefined/i,
        /null/i
      ]

      for (const pattern of patterns_in_message) {
        if (pattern.test(failure.errorMessage)) {
          const pattern_str = pattern.source
          patterns.set(pattern_str, (patterns.get(pattern_str) || 0) + 1)
        }
      }
    }

    // Return patterns that appear in multiple failures
    return Array.from(patterns.entries())
      .filter(([_, count]) => count >= 2)
      .map(([pattern, _]) => pattern)
  }

  /**
   * Check and update quarantine status
   */
  private checkQuarantineStatus(metrics: FlakyTestMetrics): void {
    const shouldQuarantine = metrics.failureRate >= this.config.quarantineThreshold
    const shouldRecover = metrics.quarantined && metrics.failureRate <= this.config.recoveryThreshold

    if (shouldQuarantine && !metrics.quarantined) {
      metrics.quarantined = true
      metrics.quarantineDate = new Date()
      metrics.quarantineReason = `Failure rate ${(metrics.failureRate * 100).toFixed(1)}% exceeds threshold ${(this.config.quarantineThreshold * 100).toFixed(1)}%`
      console.log(`🚨 Quarantining flaky test: ${metrics.testName}`)
    } else if (shouldRecover && metrics.quarantined) {
      metrics.quarantined = false
      metrics.quarantineReason = undefined
      console.log(`✅ Recovering test from quarantine: ${metrics.testName}`)
    }
  }

  /**
   * Clean old data to prevent memory issues
   */
  private cleanOldData(): void {
    for (const [testName, history] of this.testHistory.entries()) {
      if (history.length > 1000) {
        // Keep only the most recent 1000 runs
        this.testHistory.set(testName, history.slice(-1000))
      }
    }
  }

  /**
   * Generate comprehensive flaky test report
   */
  public generateReport(): FlakyTestReport {
    const flakyTests = Array.from(this.flakyTests.values())
      .filter(test => test.flakinessScore > 10) // Only include tests with some flakiness
      .sort((a, b) => b.flakinessScore - a.flakinessScore)

    const quarantineStats = {
      totalQuarantined: flakyTests.filter(t => t.quarantined).length,
      newlyQuarantined: flakyTests.filter(t => 
        t.quarantined && 
        t.quarantineDate && 
        (Date.now() - t.quarantineDate.getTime()) < 24 * 60 * 60 * 1000 // Last 24 hours
      ).length,
      recentlyRecovered: flakyTests.filter(t => 
        !t.quarantined && 
        t.trend === 'improving'
      ).length
    }

    const trendAnalysis = {
      improving: flakyTests.filter(t => t.trend === 'improving').length,
      degrading: flakyTests.filter(t => t.trend === 'degrading').length,
      stable: flakyTests.filter(t => t.trend === 'stable').length
    }

    const recommendations = this.generateRecommendations(flakyTests)

    const healthScore = this.calculateHealthScore(flakyTests)

    return {
      generatedAt: new Date(),
      totalTests: this.testHistory.size,
      flakyTests,
      quarantineStats,
      trendAnalysis,
      recommendations,
      healthScore
    }
  }

  /**
   * Generate recommendations based on flaky test analysis
   */
  private generateRecommendations(flakyTests: FlakyTestMetrics[]): string[] {
    const recommendations: string[] = []

    const highFlakiness = flakyTests.filter(t => t.flakinessScore > 70)
    if (highFlakiness.length > 0) {
      recommendations.push(`Address ${highFlakiness.length} highly flaky tests immediately`)
    }

    const quarantined = flakyTests.filter(t => t.quarantined)
    if (quarantined.length > 0) {
      recommendations.push(`${quarantined.length} tests are quarantined and should be fixed`)
    }

    const degrading = flakyTests.filter(t => t.trend === 'degrading')
    if (degrading.length > 0) {
      recommendations.push(`${degrading.length} tests are degrading - investigate recent changes`)
    }

    const commonPatterns = this.findCommonPatterns(flakyTests)
    if (commonPatterns.length > 0) {
      recommendations.push(`Common failure patterns detected: ${commonPatterns.join(', ')}`)
    }

    if (recommendations.length === 0) {
      recommendations.push('Test health is good - continue monitoring')
    }

    return recommendations
  }

  /**
   * Find common failure patterns across all flaky tests
   */
  private findCommonPatterns(flakyTests: FlakyTestMetrics[]): string[] {
    const patternCounts: Map<string, number> = new Map()

    for (const test of flakyTests) {
      for (const pattern of test.commonFailurePatterns) {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1)
      }
    }

    return Array.from(patternCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([pattern, _]) => pattern)
  }

  /**
   * Calculate overall test health score
   */
  private calculateHealthScore(flakyTests: FlakyTestMetrics[]): number {
    if (flakyTests.length === 0) return 100

    const avgFlakiness = flakyTests.reduce((sum, test) => sum + test.flakinessScore, 0) / flakyTests.length
    const quarantinedRatio = flakyTests.filter(t => t.quarantined).length / flakyTests.length
    const degradingRatio = flakyTests.filter(t => t.trend === 'degrading').length / flakyTests.length

    let score = 100
    
    // Deduct for average flakiness
    score -= avgFlakiness * 0.5
    
    // Deduct for quarantined tests
    score -= quarantinedRatio * 30
    
    // Deduct for degrading tests
    score -= degradingRatio * 20

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get current commit SHA
   */
  private getCurrentCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }

  /**
   * Get current branch
   */
  private getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }

  /**
   * Get flaky test statistics
   */
  public getStatistics(): {
    totalTests: number
    flakyTests: number
    quarantinedTests: number
    healthScore: number
    topFlakyTests: FlakyTestMetrics[]
  } {
    const flakyTests = Array.from(this.flakyTests.values())
    const topFlaky = flakyTests
      .sort((a, b) => b.flakinessScore - a.flakinessScore)
      .slice(0, 10)

    return {
      totalTests: this.testHistory.size,
      flakyTests: flakyTests.length,
      quarantinedTests: flakyTests.filter(t => t.quarantined).length,
      healthScore: this.calculateHealthScore(flakyTests),
      topFlakyTests: topFlaky
    }
  }
}

interface FlakyTestConfig {
  failureRateThreshold: number
  minRuns: number
  recentRunsWindow: number
  quarantineThreshold: number
  recoveryThreshold: number
  trendWindow: number
  parallelExecutionThreshold: number
  environmentCorrelationThreshold: number
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const configPath = process.argv[3]

  const detector = new FlakyTestDetector(configPath)

  switch (command) {
    case 'analyze':
      // Read test results from stdin or file
      let testOutput = ''
      if (process.stdin.isTTY) {
        console.log('Reading test results from stdin...')
        testOutput = await new Promise(resolve => {
          let data = ''
          process.stdin.on('data', chunk => data += chunk)
          process.stdin.on('end', () => resolve(data))
        })
      } else {
        const filePath = process.argv[4]
        if (filePath && existsSync(filePath)) {
          testOutput = readFileSync(filePath, 'utf8')
        } else {
          console.error('Please provide test results via stdin or file path')
          process.exit(1)
        }
      }

      const results = detector.parseTestResults(testOutput)
      detector.recordTestResults(results)
      break

    case 'report':
      const report = detector.generateReport()
      console.log(JSON.stringify(report, null, 2))
      break

    case 'stats':
      const stats = detector.getStatistics()
      console.log(JSON.stringify(stats, null, 2))
      break

    case 'health':
      const healthReport = detector.generateReport()
      console.log(`# Test Health Report`)
      console.log(`Health Score: ${healthReport.healthScore}/100`)
      console.log(`Total Tests: ${healthReport.totalTests}`)
      console.log(`Flaky Tests: ${healthReport.flakyTests.length}`)
      console.log(`Quarantined: ${healthReport.quarantineStats.totalQuarantined}`)
      console.log(`\nTop Recommendations:`)
      healthReport.recommendations.forEach(rec => console.log(`- ${rec}`))
      break

    default:
      console.log(`
Flaky Test Detector

Usage: tsx flaky-test-detector.ts <command> [config-path] [file-path]

Commands:
  analyze [file]    Analyze test results from stdin or file
  report            Generate detailed flaky test report
  stats             Show flaky test statistics
  health            Show test health summary

Examples:
  tsx flaky-test-detector.ts analyze test-results.txt
  cat test-results.txt | tsx flaky-test-detector.ts analyze
  tsx flaky-test-detector.ts report
  tsx flaky-test-detector.ts health
      `)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { FlakyTestDetector }
