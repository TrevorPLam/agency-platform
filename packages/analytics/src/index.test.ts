import { describe, expect, it } from 'vitest'
import * as analytics from './index'

describe('analytics public API', () => {
  it('exports client analytics helpers', () => {
    expect(analytics.initAnalytics).toBeTypeOf('function')
    expect(analytics.captureEvent).toBeTypeOf('function')
    expect(analytics.identifyUser).toBeTypeOf('function')
    expect(analytics.resetUser).toBeTypeOf('function')
    expect(analytics.getPostHogClient).toBeTypeOf('function')
  })

  it('exports server analytics helpers', () => {
    expect(analytics.captureServerEvent).toBeTypeOf('function')
    expect(analytics.identifyServerUser).toBeTypeOf('function')
    expect(analytics.aliasServerUser).toBeTypeOf('function')
    expect(analytics.flushServerEvents).toBeTypeOf('function')
    expect(analytics.getPostHogServerClient).toBeTypeOf('function')
  })
})
