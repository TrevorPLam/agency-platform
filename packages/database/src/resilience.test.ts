import {
  executeWithRetry,
  isSupabaseTransientError,
  withTimeout,
} from './resilience'

describe('resilience helpers', () => {
  it('retries transient failures and succeeds', async () => {
    let attempts = 0
    const value = await executeWithRetry(
      async () => {
        attempts += 1
        if (attempts < 3) {
          throw new Error('connection timeout')
        }
        return 'ok'
      },
      isSupabaseTransientError,
      { retries: 3, baseDelayMs: 1, maxDelayMs: 5, jitterRatio: 0 }
    )

    expect(value).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('times out long operations', async () => {
    await expect(
      withTimeout(async () => new Promise((resolve) => setTimeout(resolve, 25)), 5, 'Timed out')
    ).rejects.toThrowError()
  })
})
