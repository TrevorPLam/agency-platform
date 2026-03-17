import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as serverModule from './server'

// Simple tests for analytics server functions
describe('Analytics Server - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-ph-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should have captureServerEvent function', () => {
    expect(typeof serverModule.captureServerEvent).toBe('function')
  })

  it('should have identifyServerUser function', () => {
    expect(typeof serverModule.identifyServerUser).toBe('function')
  })

  it('should have aliasServerUser function', () => {
    expect(typeof serverModule.aliasServerUser).toBe('function')
  })

  it('should have flushServerEvents function', () => {
    expect(typeof serverModule.flushServerEvents).toBe('function')
  })

  it('should have getPostHogServerClient function', () => {
    expect(typeof serverModule.getPostHogServerClient).toBe('function')
  })

  it('should handle missing API key gracefully', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

    // These should not throw errors
    expect(() => serverModule.captureServerEvent('user-123', 'test_event', { tenant: 'test' })).not.toThrow()
    expect(() => serverModule.identifyServerUser('user-123', { tenant: 'test' })).not.toThrow()
    expect(() => serverModule.aliasServerUser('new-id', 'old-id', 'test')).not.toThrow()
  })

  it('should return null client when no API key', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')

    const client = serverModule.getPostHogServerClient()
    expect(client).toBeNull()
  })
})
