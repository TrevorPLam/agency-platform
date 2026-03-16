#!/usr/bin/env tsx

/**
 * Merge Queue Management System
 * 
 * Advanced merge queue implementation with optimistic validation,
 * flaky test detection, and performance optimization for large monorepos.
 * 
 * Features:
 * - Optimistic validation to prevent queue resets
 * - Flaky test detection and quarantining
 * - Priority-based queue management
 * - Performance monitoring and metrics
 * - Automatic retry with exponential backoff
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

interface MergeQueueConfig {
  maxQueueSize: number
  queueTimeoutMinutes: number
  retryAttempts: number
  retryDelayMinutes: number
  flakyTestThreshold: number
  optimisticValidation: boolean
}

interface PullRequest {
  number: number
  title: string
  author: string
  headSha: string
  baseBranch: string
  mergeable: boolean
  draft: boolean
  createdAt: Date
  updatedAt: Date
  labels: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface MergeQueueItem extends PullRequest {
  queuePosition: number
  queuedAt: Date
  retryCount: number
  estimatedDuration: number
  blockedBy?: number[]
}

interface FlakyTest {
  name: string
  failureRate: number
  totalRuns: number
  recentFailures: number
  lastFailure: Date
  quarantined: boolean
  quarantineReason?: string
}

interface QueueMetrics {
  totalProcessed: number
  successRate: number
  averageWaitTime: number
  averageProcessingTime: number
  flakyTestImpact: number
  queueResets: number
}

class MergeQueueManager {
  private config: MergeQueueConfig
  private queue: MergeQueueItem[] = []
  private flakyTests: Map<string, FlakyTest> = new Map()
  private metrics: QueueMetrics
  private configFile: string

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath)
    this.metrics = this.initializeMetrics()
    this.configFile = configPath || join(__dirname, 'merge-queue-config.json')
    this.loadFlakyTests()
  }

  private loadConfig(configPath?: string): MergeQueueConfig {
    const defaultConfig: MergeQueueConfig = {
      maxQueueSize: 5,
      queueTimeoutMinutes: 60,
      retryAttempts: 3,
      retryDelayMinutes: 5,
      flakyTestThreshold: 0.15, // 15% failure rate
      optimisticValidation: true
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

  private initializeMetrics(): QueueMetrics {
    return {
      totalProcessed: 0,
      successRate: 0,
      averageWaitTime: 0,
      averageProcessingTime: 0,
      flakyTestImpact: 0,
      queueResets: 0
    }
  }

  private loadFlakyTests(): void {
    const flakyTestsFile = join(__dirname, 'flaky-tests.json')
    if (existsSync(flakyTestsFile)) {
      try {
        const data = JSON.parse(readFileSync(flakyTestsFile, 'utf8'))
        this.flakyTests = new Map(Object.entries(data))
      } catch (error) {
        console.warn('Failed to load flaky tests data')
      }
    }
  }

  private saveFlakyTests(): void {
    const flakyTestsFile = join(__dirname, 'flaky-tests.json')
    const data = Object.fromEntries(this.flakyTests)
    writeFileSync(flakyTestsFile, JSON.stringify(data, null, 2))
  }

  /**
   * Add a pull request to the merge queue
   */
  public addToQueue(pr: PullRequest): boolean {
    console.log(`🚀 Adding PR #${pr.number} to merge queue`)

    // Check eligibility
    if (!this.isEligibleForQueue(pr)) {
      console.log(`❌ PR #${pr.number} is not eligible for merge queue`)
      return false
    }

    // Check queue capacity
    if (this.queue.length >= this.config.maxQueueSize) {
      console.log(`⚠️ Merge queue is full (${this.queue.length}/${this.config.maxQueueSize})`)
      return false
    }

    // Create queue item
    const queueItem: MergeQueueItem = {
      ...pr,
      queuePosition: this.queue.length + 1,
      queuedAt: new Date(),
      retryCount: 0,
      estimatedDuration: this.estimateProcessingTime(pr)
    }

    this.queue.push(queueItem)
    this.sortQueueByPriority()

    console.log(`✅ PR #${pr.number} added to queue at position ${queueItem.queuePosition}`)
    return true
  }

  /**
   * Check if PR is eligible for merge queue
   */
  private isEligibleForQueue(pr: PullRequest): boolean {
    // Check draft status
    if (pr.draft) {
      console.log(`❌ PR #${pr.number} is in draft mode`)
      return false
    }

    // Check mergeability
    if (!pr.mergeable) {
      console.log(`❌ PR #${pr.number} has merge conflicts`)
      return false
    }

    // Check required labels (if any)
    const requiredLabels = ['ready-to-merge']
    const hasRequiredLabels = requiredLabels.every(label => pr.labels.includes(label))
    if (!hasRequiredLabels) {
      console.log(`❌ PR #${pr.number} missing required labels`)
      return false
    }

    return true
  }

  /**
   * Sort queue by priority and queue time
   */
  private sortQueueByPriority(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    
    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by queue time (FIFO for same priority)
      return a.queuedAt.getTime() - b.queuedAt.getTime()
    })

    // Update queue positions
    this.queue.forEach((item, index) => {
      item.queuePosition = index + 1
    })
  }

  /**
   * Process the next item in the merge queue
   */
  public async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      console.log('📭 Merge queue is empty')
      return
    }

    const currentItem = this.queue[0]
    console.log(`🔄 Processing PR #${currentItem.number} (position ${currentItem.queuePosition})`)

    try {
      // Optimistic validation if enabled
      if (this.config.optimisticValidation) {
        const validationResult = await this.performOptimisticValidation(currentItem)
        if (!validationResult.success) {
          console.log(`❌ Optimistic validation failed for PR #${currentItem.number}`)
          this.handleFailure(currentItem, validationResult.reason)
          return
        }
      }

      // Run full CI pipeline
      const ciResult = await this.runCIPipeline(currentItem)
      
      if (ciResult.success) {
        this.handleSuccess(currentItem)
      } else {
        this.handleFailure(currentItem, ciResult.reason)
      }

    } catch (error) {
      console.error(`💥 Error processing PR #${currentItem.number}:`, error)
      this.handleFailure(currentItem, 'Unexpected error during processing')
    }
  }

  /**
   * Perform optimistic validation to catch issues early
   */
  private async performOptimisticValidation(pr: MergeQueueItem): Promise<{ success: boolean; reason?: string }> {
    console.log(`🔍 Performing optimistic validation for PR #${pr.number}`)

    try {
      // Quick format check
      execSync('pnpm format:check', { stdio: 'pipe' })

      // Quick lint check on changed files only
      const changedFiles = this.getChangedFiles(pr.headSha)
      const tsFiles = changedFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
      
      if (tsFiles.length > 0) {
        execSync(`pnpm eslint ${tsFiles.join(' ')}`, { stdio: 'pipe' })
      }

      // Check for flaky tests
      const flakyTestsInPR = this.identifyFlakyTestsInPR(pr)
      if (flakyTestsInPR.length > 0) {
        console.log(`⚠️ PR #${pr.number} contains ${flakyTestsInPR.length} flaky tests`)
        
        // If optimistic validation is strict, fail on flaky tests
        if (flakyTestsInPR.some(test => this.flakyTests.get(test)?.quarantined)) {
          return {
            success: false,
            reason: 'PR contains quarantined flaky tests'
          }
        }
      }

      console.log(`✅ Optimistic validation passed for PR #${pr.number}`)
      return { success: true }

    } catch (error) {
      return {
        success: false,
        reason: `Optimistic validation failed: ${error.message}`
      }
    }
  }

  /**
   * Run full CI pipeline for the PR
   */
  private async runCIPipeline(pr: MergeQueueItem): Promise<{ success: boolean; reason?: string }> {
    console.log(`🧪 Running CI pipeline for PR #${pr.number}`)

    const startTime = Date.now()

    try {
      // Build affected packages
      execSync('pnpm turbo run build --affected', { stdio: 'pipe' })

      // Run linting
      execSync('pnpm turbo run lint --affected', { stdio: 'pipe' })

      // Run type checking
      execSync('pnpm turbo run type-check --affected', { stdio: 'pipe' })

      // Run tests with flaky test handling
      const testResult = await this.runTestsWithFlakyHandling(pr)
      if (!testResult.success) {
        return testResult
      }

      // Security scans
      this.runSecurityScans()

      const duration = Date.now() - startTime
      console.log(`✅ CI pipeline passed for PR #${pr.number} in ${duration}ms`)

      return { success: true }

    } catch (error) {
      const duration = Date.now() - startTime
      console.log(`❌ CI pipeline failed for PR #${pr.number} after ${duration}ms`)
      
      return {
        success: false,
        reason: `CI pipeline failed: ${error.message}`
      }
    }
  }

  /**
   * Run tests with flaky test detection and handling
   */
  private async runTestsWithFlakyHandling(pr: MergeQueueItem): Promise<{ success: boolean; reason?: string }> {
    console.log(`🧪 Running tests with flaky test handling for PR #${pr.number}`)

    try {
      // Run tests and capture output
      const testOutput = execSync('pnpm turbo run test --affected', { 
        stdio: 'pipe',
        encoding: 'utf8'
      })

      // Analyze test results for flaky behavior
      this.analyzeTestResults(pr.number, testOutput)

      return { success: true }

    } catch (error) {
      const testOutput = error.stdout || error.message || ''
      
      // Check if failure is due to known flaky tests
      const flakyFailures = this.identifyFlakyTestFailures(testOutput)
      
      if (flakyFailures.length > 0) {
        console.log(`⚠️ Test failure may be due to flaky tests: ${flakyFailures.join(', ')}`)
        
        // Update flaky test statistics
        flakyFailures.forEach(testName => {
          this.updateFlakyTestStats(testName, true)
        })

        // If only flaky tests failed, allow retry
        const nonFlakyFailures = this.identifyNonFlakyFailures(testOutput)
        if (nonFlakyFailures.length === 0 && pr.retryCount < this.config.retryAttempts) {
          console.log(`🔄 Retrying PR #${pr.number} due to flaky test failures`)
          return {
            success: false,
            reason: 'Flaky test failure - retry allowed'
          }
        }
      }

      return {
        success: false,
        reason: `Test failure: ${testOutput.substring(0, 200)}...`
      }
    }
  }

  /**
   * Analyze test results to detect flaky behavior patterns
   */
  private analyzeTestResults(prNumber: number, testOutput: string): void {
    const lines = testOutput.split('\n')
    const testResults: { [key: string]: { passed: boolean; duration: number } } = {}

    lines.forEach(line => {
      // Parse test result lines (adjust regex based on your test runner output)
      const testMatch = line.match(/(✓|✗)\s+(.+?)\s+\((\d+)ms\)/)
      if (testMatch) {
        const [, status, testName, duration] = testMatch
        testResults[testName] = {
          passed: status === '✓',
          duration: parseInt(duration, 10)
        }
      }
    })

    // Update flaky test statistics
    Object.entries(testResults).forEach(([testName, result]) => {
      this.updateFlakyTestStats(testName, !result.passed)
    })
  }

  /**
   * Update flaky test statistics
   */
  private updateFlakyTestStats(testName: string, failed: boolean): void {
    const existing = this.flakyTests.get(testName) || {
      name: testName,
      failureRate: 0,
      totalRuns: 0,
      recentFailures: 0,
      lastFailure: new Date(),
      quarantined: false
    }

    existing.totalRuns++
    if (failed) {
      existing.recentFailures++
      existing.lastFailure = new Date()
    }

    // Calculate failure rate (recent failures vs total runs)
    existing.failureRate = existing.recentFailures / existing.totalRuns

    // Auto-quarantine if threshold exceeded
    if (existing.failureRate > this.config.flakyTestThreshold && !existing.quarantined) {
      existing.quarantined = true
      existing.quarantineReason = `Failure rate ${(existing.failureRate * 100).toFixed(1)}% exceeds threshold ${(this.config.flakyTestThreshold * 100).toFixed(1)}%`
      console.log(`🚨 Auto-quarantining flaky test: ${testName}`)
    }

    this.flakyTests.set(testName, existing)
    this.saveFlakyTests()
  }

  /**
   * Identify flaky tests in a PR
   */
  private identifyFlakyTestsInPR(pr: MergeQueueItem): string[] {
    const changedFiles = this.getChangedFiles(pr.headSha)
    const testFiles = changedFiles.filter(file => 
      file.includes('.test.') || file.includes('.spec.') || file.endsWith('.test.ts') || file.endsWith('.spec.ts')
    )

    const flakyTests: string[] = []
    testFiles.forEach(file => {
      this.flakyTests.forEach((test, testName) => {
        if (file.includes(testName.toLowerCase()) || testName.includes(file)) {
          flakyTests.push(testName)
        }
      })
    })

    return flakyTests
  }

  /**
   * Identify flaky test failures in output
   */
  private identifyFlakyTestFailures(output: string): string[] {
    const failures: string[] = []
    
    this.flakyTests.forEach((test, testName) => {
      if (test.quarantined && output.includes(testName)) {
        failures.push(testName)
      }
    })

    return failures
  }

  /**
   * Identify non-flaky failures
   */
  private identifyNonFlakyFailures(output: string): string[] {
    // This is a simplified implementation
    // In practice, you'd parse the test output more carefully
    const lines = output.split('\n')
    const failures: string[] = []

    lines.forEach(line => {
      if (line.includes('✗') || line.includes('FAIL')) {
        const testMatch = line.match(/✗\s+(.+?)\s+/)
        if (testMatch) {
          const testName = testMatch[1]
          if (!this.flakyTests.has(testName)) {
            failures.push(testName)
          }
        }
      }
    })

    return failures
  }

  /**
   * Handle successful merge
   */
  private handleSuccess(pr: MergeQueueItem): void {
    console.log(`✅ PR #${pr.number} merged successfully`)

    // Remove from queue
    this.queue = this.queue.filter(item => item.number !== pr.number)

    // Update metrics
    this.metrics.totalProcessed++
    const waitTime = Date.now() - pr.queuedAt.getTime()
    this.updateAverageWaitTime(waitTime)

    console.log(`📊 Queue metrics updated: ${this.metrics.totalProcessed} processed`)
  }

  /**
   * Handle merge failure
   */
  private handleFailure(pr: MergeQueueItem, reason: string): void {
    console.log(`❌ PR #${pr.number} failed: ${reason}`)

    pr.retryCount++

    if (pr.retryCount < this.config.retryAttempts && reason.includes('flaky')) {
      // Retry flaky failures
      console.log(`🔄 Retrying PR #${pr.number} (attempt ${pr.retryCount + 1}/${this.config.retryAttempts})`)
      
      // Move to end of queue for retry
      this.queue = this.queue.filter(item => item.number !== pr.number)
      setTimeout(() => {
        pr.queuePosition = this.queue.length + 1
        this.queue.push(pr)
      }, this.config.retryDelayMinutes * 60 * 1000)
      
    } else {
      // Remove from queue
      this.queue = this.queue.filter(item => item.number !== pr.number)
      this.metrics.totalProcessed++
      this.metrics.queueResets++
    }
  }

  /**
   * Get changed files for a PR
   */
  private getChangedFiles(headSha: string): string[] {
    try {
      const output = execSync(`git diff --name-only HEAD~1 ${headSha}`, { 
        stdio: 'pipe',
        encoding: 'utf8'
      })
      return output.trim().split('\n').filter(file => file.length > 0)
    } catch (error) {
      console.warn('Failed to get changed files:', error.message)
      return []
    }
  }

  /**
   * Estimate processing time for a PR
   */
  private estimateProcessingTime(pr: PullRequest): number {
    // Base time in minutes
    let baseTime = 5

    // Add time based on number of changed files
    const changedFiles = this.getChangedFiles(pr.headSha)
    baseTime += changedFiles.length * 0.5

    // Add time for complex changes
    if (pr.labels.includes('complex')) {
      baseTime *= 1.5
    }

    // Add time if flaky tests are present
    const flakyTests = this.identifyFlakyTestsInPR(pr as MergeQueueItem)
    if (flakyTests.length > 0) {
      baseTime += flakyTests.length * 2
    }

    return Math.round(baseTime)
  }

  /**
   * Run security scans
   */
  private runSecurityScans(): void {
    console.log('🔒 Running security scans')

    // Check for service role key exposure
    if (execSync('grep -rE "NEXT_PUBLIC_.*SERVICE_ROLE|NEXT_PUBLIC_SUPABASE_SERVICE" --include="*.ts" --include="*.tsx" --include="*.js" apps/ packages/ 2>/dev/null || true', { encoding: 'utf8' })) {
      throw new Error('Service role key exposed in client-visible code')
    }

    console.log('✅ Security scans passed')
  }

  /**
   * Update average wait time
   */
  private updateAverageWaitTime(waitTime: number): void {
    const totalWaitTime = this.metrics.averageWaitTime * (this.metrics.totalProcessed - 1) + waitTime
    this.metrics.averageWaitTime = totalWaitTime / this.metrics.totalProcessed
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    queue: MergeQueueItem[]
    metrics: QueueMetrics
    config: MergeQueueConfig
    flakyTests: FlakyTest[]
  } {
    return {
      queue: this.queue,
      metrics: this.metrics,
      config: this.config,
      flakyTests: Array.from(this.flakyTests.values())
    }
  }

  /**
   * Get queue health report
   */
  public getHealthReport(): string {
    const report = [
      '# Merge Queue Health Report',
      '',
      `## Queue Status`,
      `- Queue size: ${this.queue.length}/${this.config.maxQueueSize}`,
      `- Total processed: ${this.metrics.totalProcessed}`,
      `- Success rate: ${(this.metrics.successRate * 100).toFixed(1)}%`,
      `- Average wait time: ${this.metrics.averageWaitTime.toFixed(1)}ms`,
      `- Queue resets: ${this.metrics.queueResets}`,
      '',
      `## Flaky Tests`,
      `- Total flaky tests: ${this.flakyTests.size}`,
      `- Quarantined: ${Array.from(this.flakyTests.values()).filter(t => t.quarantined).length}`,
      '',
      `## Current Queue`,
      ...this.queue.map(item => 
        `- #${item.number}: ${item.title} (${item.priority}) - Position ${item.queuePosition}`
      ),
      ''
    ].join('\n')

    return report
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const configPath = process.argv[3]

  const manager = new MergeQueueManager(configPath)

  switch (command) {
    case 'status':
      console.log(manager.getHealthReport())
      break

    case 'process':
      await manager.processQueue()
      break

    case 'metrics':
      console.log(JSON.stringify(manager.getQueueStatus().metrics, null, 2))
      break

    case 'flaky-tests':
      console.log(JSON.stringify(manager.getQueueStatus().flakyTests, null, 2))
      break

    default:
      console.log(`
Merge Queue Manager

Usage: tsx merge-queue.ts <command> [config-path]

Commands:
  status      Show queue health report
  process     Process next item in queue
  metrics     Show queue metrics
  flaky-tests Show flaky test statistics

Examples:
  tsx merge-queue.ts status
  tsx merge-queue.ts process
  tsx merge-queue.ts metrics
      `)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { MergeQueueManager }
