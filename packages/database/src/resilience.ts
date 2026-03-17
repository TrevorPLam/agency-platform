import { ExternalServiceError } from './errors'

export interface RetryPolicy {
  retries: number
  baseDelayMs: number
  maxDelayMs: number
  jitterRatio: number
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  retries: 2,
  baseDelayMs: 200,
  maxDelayMs: 2500,
  jitterRatio: 0.2,
}

function calculateRetryDelayMs(attempt: number, policy: RetryPolicy): number {
  const exponentialDelay = Math.min(
    policy.baseDelayMs * Math.pow(2, attempt),
    policy.maxDelayMs
  )
  const jitter = exponentialDelay * policy.jitterRatio * Math.random()
  return Math.floor(exponentialDelay + jitter)
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): Promise<T> {
  let currentAttempt = 0
  let lastError: unknown = new ExternalServiceError()

  while (currentAttempt <= policy.retries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (currentAttempt >= policy.retries || !shouldRetry(error)) {
        throw error
      }
      const delayMs = calculateRetryDelayMs(currentAttempt, policy)
      await sleep(delayMs)
      currentAttempt += 1
    }
  }

  throw lastError
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    setTimeout(() => {
      reject(new ExternalServiceError(timeoutMessage))
    }, timeoutMs)
  })
  return Promise.race([operation(), timeoutPromise])
}

export function isSupabaseTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  const message = error.message.toLowerCase()
  return (
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('network') ||
    message.includes('service unavailable')
  )
}
