import { test, expect } from '@playwright/test'

export class PerformanceUtils {
  static async measurePageLoad(page: any, url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }> {
    const startTime = Date.now()
    
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
      }
    })
    
    return {
      loadTime,
      ...metrics,
    }
  }

  static async measureInteraction(page: any, interaction: () => Promise<void>): Promise<{
    interactionTime: number;
    responseTime: number;
  }> {
    const startTime = Date.now()
    
    await interaction()
    
    const interactionTime = Date.now() - startTime
    
    // Wait for any network activity to complete
    await page.waitForLoadState('networkidle')
    const responseTime = Date.now() - startTime
    
    return {
      interactionTime,
      responseTime,
    }
  }

  static async getCoreWebVitals(page: any): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  }> {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          const lcp = lastEntry?.startTime || 0
          
          // First Input Delay
          let fid = 0
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            if (entries.length > 0) {
              fid = entries[0].processingStart - entries[0].startTime
            }
          }).observe({ type: 'first-input', buffered: true })
          
          // Cumulative Layout Shift
          let cls = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value
              }
            }
          }).observe({ type: 'layout-shift', buffered: true })
          
          // Resolve after a short delay to ensure metrics are collected
          setTimeout(() => {
            resolve({ lcp, fid, cls })
          }, 1000)
        }).observe({ type: 'largest-contentful-paint', buffered: true })
      })
    })
  }

  static async measureMemoryUsage(page: any): Promise<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }> {
    return await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        }
      }
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      }
    })
  }

  static async measureBundleSize(page: any): Promise<{
    totalSize: number;
    bundleCount: number;
    largestBundle: number;
  }> {
    const responses: any[] = []
    
    page.on('response', (response: any) => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: parseInt(response.headers()['content-length'] || '0'),
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const totalSize = responses.reduce((sum, response) => sum + response.size, 0)
    const bundleCount = responses.length
    const largestBundle = Math.max(...responses.map(response => response.size))
    
    return {
      totalSize,
      bundleCount,
      largestBundle,
    }
  }

  static async measureNetworkRequests(page: any): Promise<{
    totalRequests: number;
    totalSize: number;
    slowRequests: number;
    failedRequests: number;
  }> {
    const requests: any[] = []
    
    page.on('request', (request: any) => {
      requests.push({ url: request.url(), startTime: Date.now() })
    })
    
    page.on('response', (response: any) => {
      const request = requests.find(r => r.url === response.url())
      if (request) {
        request.endTime = Date.now()
        request.size = parseInt(response.headers()['content-length'] || '0')
        request.status = response.status()
        request.failed = response.status() >= 400
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const completedRequests = requests.filter(r => r.endTime)
    const totalRequests = completedRequests.length
    const totalSize = completedRequests.reduce((sum, r) => sum + (r.size || 0), 0)
    const slowRequests = completedRequests.filter(r => r.endTime - r.startTime > 1000).length
    const failedRequests = completedRequests.filter(r => r.failed).length
    
    return {
      totalRequests,
      totalSize,
      slowRequests,
      failedRequests,
    }
  }
}

export class PerformanceThresholds {
  static readonly PAGE_LOAD = {
    EXCELLENT: 1000, // 1 second
    GOOD: 2000, // 2 seconds
    ACCEPTABLE: 3000, // 3 seconds
  }

  static readonly INTERACTION = {
    EXCELLENT: 100, // 100ms
    GOOD: 200, // 200ms
    ACCEPTABLE: 500, // 500ms
  }

  static readonly CORE_WEB_VITALS = {
    LCP: {
      EXCELLENT: 1200, // 1.2 seconds
      GOOD: 2500, // 2.5 seconds
      NEEDS_IMPROVEMENT: 4000, // 4 seconds
    },
    FID: {
      EXCELLENT: 100, // 100ms
      GOOD: 300, // 300ms
      NEEDS_IMPROVEMENT: 1000, // 1 second
    },
    CLS: {
      EXCELLENT: 0.1,
      GOOD: 0.25,
      NEEDS_IMPROVEMENT: 0.5,
    },
  }

  static readonly BUNDLE_SIZE = {
    EXCELLENT: 1024 * 1024, // 1MB
    GOOD: 2 * 1024 * 1024, // 2MB
    ACCEPTABLE: 3 * 1024 * 1024, // 3MB
  }

  static readonly NETWORK = {
    EXCELLENT: { requests: 20, size: 1024 * 1024 }, // 20 requests, 1MB
    GOOD: { requests: 50, size: 2 * 1024 * 1024 }, // 50 requests, 2MB
    ACCEPTABLE: { requests: 100, size: 3 * 1024 * 1024 }, // 100 requests, 3MB
  }

  static evaluatePerformance(value: number, thresholds: { EXCELLENT: number; GOOD: number; ACCEPTABLE: number }): 'excellent' | 'good' | 'acceptable' | 'needs-improvement' {
    if (value <= thresholds.EXCELLENT) return 'excellent'
    if (value <= thresholds.GOOD) return 'good'
    if (value <= thresholds.ACCEPTABLE) return 'acceptable'
    return 'needs-improvement'
  }

  static evaluateCoreWebVitals(metrics: { lcp: number; fid: number; cls: number }): {
    overall: 'excellent' | 'good' | 'needs-improvement';
    lcp: 'excellent' | 'good' | 'needs-improvement';
    fid: 'excellent' | 'good' | 'needs-improvement';
    cls: 'excellent' | 'good' | 'needs-improvement';
  } {
    const lcp = this.evaluateLCP(metrics.lcp)
    const fid = this.evaluateFID(metrics.fid)
    const cls = this.evaluateCLS(metrics.cls)
    
    const overall = [lcp, fid, cls].every(rating => rating === 'excellent') ? 'excellent' :
                   [lcp, fid, cls].every(rating => rating !== 'needs-improvement') ? 'good' : 'needs-improvement'
    
    return { overall, lcp, fid, cls }
  }

  private static evaluateLCP(lcp: number): 'excellent' | 'good' | 'needs-improvement' {
    if (lcp <= this.CORE_WEB_VITALS.LCP.EXCELLENT) return 'excellent'
    if (lcp <= this.CORE_WEB_VITALS.LCP.GOOD) return 'good'
    return 'needs-improvement'
  }

  private static evaluateFID(fid: number): 'excellent' | 'good' | 'needs-improvement' {
    if (fid <= this.CORE_WEB_VITALS.FID.EXCELLENT) return 'excellent'
    if (fid <= this.CORE_WEB_VITALS.FID.GOOD) return 'good'
    return 'needs-improvement'
  }

  private static evaluateCLS(cls: number): 'excellent' | 'good' | 'needs-improvement' {
    if (cls <= this.CORE_WEB_VITALS.CLS.EXCELLENT) return 'excellent'
    if (cls <= this.CORE_WEB_VITALS.CLS.GOOD) return 'good'
    return 'needs-improvement'
  }
}

export class PerformanceReporter {
  static generateReport(metrics: any, thresholds: any): string {
    const report = [
      '# Performance Test Report',
      '',
      '## Page Load Performance',
      `- Load Time: ${metrics.loadTime}ms (${PerformanceThresholds.evaluatePerformance(metrics.loadTime, PerformanceThresholds.PAGE_LOAD)})`,
      `- DOM Content Loaded: ${metrics.domContentLoaded}ms`,
      `- First Contentful Paint: ${metrics.firstContentfulPaint}ms`,
      `- Largest Contentful Paint: ${metrics.largestContentfulPaint}ms`,
      '',
      '## Core Web Vitals',
      `- LCP: ${metrics.lcp}ms (${PerformanceThresholds.evaluateLCP(metrics.lcp)})`,
      `- FID: ${metrics.fid}ms (${PerformanceThresholds.evaluateFID(metrics.fid)})`,
      `- CLS: ${metrics.cls} (${PerformanceThresholds.evaluateCLS(metrics.cls)})`,
      '',
      '## Network Performance',
      `- Total Requests: ${metrics.totalRequests}`,
      `- Total Size: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`,
      `- Slow Requests: ${metrics.slowRequests}`,
      `- Failed Requests: ${metrics.failedRequests}`,
      '',
      '## Bundle Size',
      `- Total Bundle Size: ${(metrics.totalSize / 1024 / 1024).toFixed(2)}MB`,
      `- Bundle Count: ${metrics.bundleCount}`,
      `- Largest Bundle: ${(metrics.largestBundle / 1024).toFixed(2)}KB`,
      '',
      '## Memory Usage',
      `- Used JS Heap: ${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      `- Total JS Heap: ${(metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      `- JS Heap Limit: ${(metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    ].join('\n')
    
    return report
  }
}
