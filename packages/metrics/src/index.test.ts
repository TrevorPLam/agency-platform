import { describe, expect, it } from 'vitest'
import * as metrics from './index'

describe('metrics public API', () => {
  it('exports all metric trackers', () => {
    expect(metrics.DORAMetricsCollector).toBeTypeOf('function')
    expect(metrics.DeploymentFrequencyTracker).toBeTypeOf('function')
    expect(metrics.LeadTimeCalculator).toBeTypeOf('function')
    expect(metrics.ChangeFailureRateMonitor).toBeTypeOf('function')
    expect(metrics.MTTRTracker).toBeTypeOf('function')
    expect(metrics.MetricsStorage).toBeTypeOf('function')
  })
})
