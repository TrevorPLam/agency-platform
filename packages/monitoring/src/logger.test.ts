import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRequestLogger, logError, logInfo, logWarn } from './logger'

describe('logger utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes info logs to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logInfo('hello', { requestId: 'req-1' })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('writes warn logs to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logWarn('warn-message')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('writes error logs to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logError('err-message')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('creates a request-scoped logger', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const logger = createRequestLogger({ requestId: 'req-2', service: 'monitoring' })
    logger.info('scoped')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
