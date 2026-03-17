import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  isAppError,
} from './errors'

describe('typed errors', () => {
  it('creates authentication errors with 401 status', () => {
    const error = new AuthenticationError()
    expect(error.status).toBe(401)
    expect(error.code).toBe('AUTHENTICATION_REQUIRED')
    expect(isAppError(error)).toBe(true)
  })

  it('creates authorization errors with 403 status', () => {
    const error = new AuthorizationError('Denied')
    expect(error.status).toBe(403)
    expect(error.detail).toBe('Denied')
  })

  it('supports metadata for validation errors', () => {
    const error = new ValidationError('Invalid input', { field: 'email' })
    expect(error.metadata).toEqual({ field: 'email' })
    expect(error.status).toBe(400)
  })

  it('recognizes base app errors', () => {
    const error = new AppError({
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Internal server error',
      type: 'https://agency.dev/problems/internal-error',
      detail: 'Unexpected failure.',
    })
    expect(isAppError(error)).toBe(true)
  })
})
