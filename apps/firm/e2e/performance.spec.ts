import { test, expect } from '@playwright/test'
import { PerformanceUtils, PerformanceThresholds, PerformanceReporter } from '../utils/performance'

test.describe('Performance Testing Suite', () => {
  test('Firm app - Homepage performance', async ({ page }) => {
    const metrics = await PerformanceUtils.measurePageLoad(page, 'http://localhost:3000')
    
    // Verify page load performance
    expect(metrics.loadTime).toBeLessThan(PerformanceThresholds.PAGE_LOAD.ACCEPTABLE)
    expect(metrics.domContentLoaded).toBeLessThan(2000)
    expect(metrics.firstContentfulPaint).toBeLessThan(1500)
    expect(metrics.largestContentfulPaint).toBeLessThan(2500)
    
    // Generate performance report
    const report = PerformanceReporter.generateReport(metrics, PerformanceThresholds)
    console.log('Firm Homepage Performance Report:')
    console.log(report)
  })

  test('Firm app - Contact form performance', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    const interactionMetrics = await PerformanceUtils.measureInteraction(page, async () => {
      await page.getByRole('link', { name: /contact/i }).click()
    })
    
    // Verify interaction performance
    expect(interactionMetrics.interactionTime).toBeLessThan(PerformanceThresholds.INTERACTION.ACCEPTABLE)
    expect(interactionMetrics.responseTime).toBeLessThan(1000)
    
    // Test form submission performance
    const formMetrics = await PerformanceUtils.measureInteraction(page, async () => {
      await page.getByLabel(/name/i).fill('Performance Test User')
      await page.getByLabel(/email/i).fill('performance@test.com')
      await page.getByLabel(/message/i).fill('Performance test message')
      await page.getByRole('button', { name: /send/i }).click()
    })
    
    expect(formMetrics.interactionTime).toBeLessThan(PerformanceThresholds.INTERACTION.ACCEPTABLE)
  })

  test('Agency Admin - Dashboard performance', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3001/login')
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Measure dashboard load
    const metrics = await PerformanceUtils.measurePageLoad(page, 'http://localhost:3001/dashboard')
    
    // Admin dashboard should load quickly
    expect(metrics.loadTime).toBeLessThan(PerformanceThresholds.PAGE_LOAD.GOOD)
    expect(metrics.domContentLoaded).toBeLessThan(1500)
    
    console.log('Agency Admin Dashboard Performance:')
    console.log(`Load Time: ${metrics.loadTime}ms`)
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`)
  })

  test('Client sites - Riley Day Care performance', async ({ page }) => {
    const metrics = await PerformanceUtils.measurePageLoad(page, 'http://localhost:3002')
    
    // Client site should be lightweight and fast
    expect(metrics.loadTime).toBeLessThan(PerformanceThresholds.PAGE_LOAD.EXCELLENT)
    expect(metrics.firstContentfulPaint).toBeLessThan(1000)
    
    // Test client-specific interactions
    const contactMetrics = await PerformanceUtils.measureInteraction(page, async () => {
      await page.getByRole('link', { name: /contact/i }).click()
    })
    
    expect(contactMetrics.interactionTime).toBeLessThan(PerformanceThresholds.INTERACTION.EXCELLENT)
  })

  test('Client sites - The Barber Cave performance', async ({ page }) => {
    const metrics = await PerformanceUtils.measurePageLoad(page, 'http://localhost:3003')
    
    // Client site should be lightweight and fast
    expect(metrics.loadTime).toBeLessThan(PerformanceThresholds.PAGE_LOAD.EXCELLENT)
    expect(metrics.firstContentfulPaint).toBeLessThan(1000)
    
    // Test booking flow performance
    const bookingMetrics = await PerformanceUtils.measureInteraction(page, async () => {
      await page.getByRole('link', { name: /book appointment/i }).click()
    })
    
    expect(bookingMetrics.interactionTime).toBeLessThan(PerformanceThresholds.INTERACTION.EXCELLENT)
  })

  test('Core Web Vitals - Firm app', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    const vitals = await PerformanceUtils.getCoreWebVitals(page)
    const evaluation = PerformanceThresholds.evaluateCoreWebVitals(vitals)
    
    // Verify Core Web Vitals meet standards
    expect(vitals.lcp).toBeLessThan(PerformanceThresholds.CORE_WEB_VITALS.LCP.NEEDS_IMPROVEMENT)
    expect(vitals.fid).toBeLessThan(PerformanceThresholds.CORE_WEB_VITALS.FID.NEEDS_IMPROVEMENT)
    expect(vitals.cls).toBeLessThan(PerformanceThresholds.CORE_WEB_VITALS.CLS.NEEDS_IMPROVEMENT)
    
    console.log('Core Web Vitals Evaluation:', evaluation)
  })

  test('Bundle size analysis - Firm app', async ({ page }) => {
    const bundleMetrics = await PerformanceUtils.measureBundleSize(page)
    
    // Verify bundle sizes are reasonable
    expect(bundleMetrics.totalSize).toBeLessThan(PerformanceThresholds.BUNDLE_SIZE.ACCEPTABLE)
    expect(bundleMetrics.largestBundle).toBeLessThan(500 * 1024) // 500KB max for single bundle
    
    console.log('Bundle Analysis:')
    console.log(`Total Size: ${(bundleMetrics.totalSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Bundle Count: ${bundleMetrics.bundleCount}`)
    console.log(`Largest Bundle: ${(bundleMetrics.largestBundle / 1024).toFixed(2)}KB`)
  })

  test('Network performance - Firm app', async ({ page }) => {
    const networkMetrics = await PerformanceUtils.measureNetworkRequests(page)
    
    // Verify network performance
    expect(networkMetrics.totalRequests).toBeLessThan(PerformanceThresholds.NETWORK.ACCEPTABLE.requests)
    expect(networkMetrics.totalSize).toBeLessThan(PerformanceThresholds.NETWORK.ACCEPTABLE.size)
    expect(networkMetrics.failedRequests).toBe(0)
    expect(networkMetrics.slowRequests).toBeLessThan(5) // Maximum 5 slow requests
    
    console.log('Network Performance:')
    console.log(`Total Requests: ${networkMetrics.totalRequests}`)
    console.log(`Total Size: ${(networkMetrics.totalSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Slow Requests: ${networkMetrics.slowRequests}`)
    console.log(`Failed Requests: ${networkMetrics.failedRequests}`)
  })

  test('Memory usage - Agency Admin dashboard', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3001/login')
    await page.getByLabel(/email/i).fill('admin@agency.com')
    await page.getByLabel(/password/i).fill('test-password')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    const memoryMetrics = await PerformanceUtils.measureMemoryUsage(page)
    
    // Verify memory usage is reasonable
    expect(memoryMetrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024) // 100MB max
    
    console.log('Memory Usage:')
    console.log(`Used JS Heap: ${(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Total JS Heap: ${(memoryMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
  })

  test('Performance regression testing - Firm app', async ({ page }) => {
    // Baseline performance metrics (these should be updated periodically)
    const baseline = {
      pageLoad: 2000,
      domContentLoaded: 1500,
      firstContentfulPaint: 1000,
      largestContentfulPaint: 2000,
      interactionTime: 200,
      bundleSize: 2 * 1024 * 1024, // 2MB
    }
    
    const actualMetrics = await PerformanceUtils.measurePageLoad(page, 'http://localhost:3000')
    
    // Allow 10% regression tolerance
    const tolerance = 1.1
    
    expect(actualMetrics.loadTime).toBeLessThan(baseline.pageLoad * tolerance)
    expect(actualMetrics.domContentLoaded).toBeLessThan(baseline.domContentLoaded * tolerance)
    expect(actualMetrics.firstContentfulPaint).toBeLessThan(baseline.firstContentfulPaint * tolerance)
    expect(actualMetrics.largestContentfulPaint).toBeLessThan(baseline.largestContentfulPaint * tolerance)
    
    console.log('Performance Regression Test Results:')
    console.log(`Page Load: ${actualMetrics.loadTime}ms (baseline: ${baseline.pageLoad}ms)`)
    console.log(`DOM Content Loaded: ${actualMetrics.domContentLoaded}ms (baseline: ${baseline.domContentLoaded}ms)`)
    console.log(`FCP: ${actualMetrics.firstContentfulPaint}ms (baseline: ${baseline.firstContentfulPaint}ms)`)
    console.log(`LCP: ${actualMetrics.largestContentfulPaint}ms (baseline: ${baseline.largestContentfulPaint}ms)`)
  })

  test('Performance under load - Simulated slow network', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
      await route.continue()
    })
    
    const startTime = Date.now()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Even with slow network, page should load within reasonable time
    expect(loadTime).toBeLessThan(8000) // 8 seconds max on slow network
    
    // Test interaction performance under slow network
    const interactionStart = Date.now()
    await page.getByRole('link', { name: /contact/i }).click()
    await page.waitForLoadState('networkidle')
    const interactionTime = Date.now() - interactionStart
    
    expect(interactionTime).toBeLessThan(4000) // 4 seconds max on slow network
    
    console.log('Slow Network Performance:')
    console.log(`Page Load: ${loadTime}ms`)
    console.log(`Interaction: ${interactionTime}ms`)
  })

  test('Performance comparison - All apps', async ({ page }) => {
    const apps = [
      { name: 'Firm', url: 'http://localhost:3000' },
      { name: 'Agency Admin', url: 'http://localhost:3001' },
      { name: 'Riley Day Care', url: 'http://localhost:3002' },
      { name: 'The Barber Cave', url: 'http://localhost:3003' },
    ]
    
    const results: any[] = []
    
    for (const app of apps) {
      try {
        const metrics = await PerformanceUtils.measurePageLoad(page, app.url)
        results.push({
          app: app.name,
          loadTime: metrics.loadTime,
          domContentLoaded: metrics.domContentLoaded,
          fcp: metrics.firstContentfulPaint,
          lcp: metrics.largestContentfulPaint,
        })
      } catch (error) {
        results.push({
          app: app.name,
          error: error.message,
        })
      }
    }
    
    console.log('Performance Comparison Results:')
    results.forEach(result => {
      if (result.error) {
        console.log(`${result.app}: ERROR - ${result.error}`)
      } else {
        console.log(`${result.app}: Load=${result.loadTime}ms, DOM=${result.domContentLoaded}ms, FCP=${result.fcp}ms, LCP=${result.lcp}ms`)
      }
    })
    
    // Verify all apps load within acceptable time
    const successfulResults = results.filter(r => !r.error)
    successfulResults.forEach(result => {
      expect(result.loadTime).toBeLessThan(PerformanceThresholds.PAGE_LOAD.ACCEPTABLE)
    })
  })
})
