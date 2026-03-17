export type ErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_DENIED'
  | 'VALIDATION_FAILED'
  | 'TENANT_RESOLUTION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'DATABASE_OPERATION_FAILED'
  | 'EXTERNAL_SERVICE_FAILED'
  | 'INTERNAL_ERROR'

export interface AppErrorOptions {
  status: number
  code: ErrorCode
  title: string
  type: string
  detail: string
  retryable?: boolean
  metadata?: Record<string, unknown>
}

export class AppError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly title: string
  readonly type: string
  readonly detail: string
  readonly retryable: boolean
  readonly metadata: Record<string, unknown> | undefined

  constructor(options: AppErrorOptions) {
    super(options.detail)
    this.name = 'AppError'
    this.status = options.status
    this.code = options.code
    this.title = options.title
    this.type = options.type
    this.detail = options.detail
    this.retryable = options.retryable ?? false
    this.metadata = options.metadata
  }
}

export class AuthenticationError extends AppError {
  constructor(detail = 'Authentication is required to access this resource.') {
    super({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      title: 'Authentication required',
      type: 'https://agency.dev/problems/authentication-required',
      detail,
    })
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(detail = 'You are not authorized to access this resource.') {
    super({
      status: 403,
      code: 'AUTHORIZATION_DENIED',
      title: 'Access denied',
      type: 'https://agency.dev/problems/authorization-denied',
      detail,
    })
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends AppError {
  constructor(
    detail = 'The request payload is invalid.',
    metadata?: Record<string, unknown>
  ) {
    super({
      status: 400,
      code: 'VALIDATION_FAILED',
      title: 'Validation failed',
      type: 'https://agency.dev/problems/validation-failed',
      detail,
      ...(metadata ? { metadata } : {}),
    })
    this.name = 'ValidationError'
  }
}

export class TenantResolutionError extends AppError {
  constructor(detail = 'Unable to resolve tenant context for this request.') {
    super({
      status: 503,
      code: 'TENANT_RESOLUTION_FAILED',
      title: 'Tenant resolution failed',
      type: 'https://agency.dev/problems/tenant-resolution-failed',
      detail,
      retryable: true,
    })
    this.name = 'TenantResolutionError'
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(detail = 'The requested resource was not found.') {
    super({
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      title: 'Resource not found',
      type: 'https://agency.dev/problems/resource-not-found',
      detail,
    })
    this.name = 'ResourceNotFoundError'
  }
}

export class DatabaseOperationError extends AppError {
  constructor(detail = 'A database operation failed.') {
    super({
      status: 500,
      code: 'DATABASE_OPERATION_FAILED',
      title: 'Database operation failed',
      type: 'https://agency.dev/problems/database-operation-failed',
      detail,
      retryable: true,
    })
    this.name = 'DatabaseOperationError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(detail = 'An upstream service request failed.') {
    super({
      status: 502,
      code: 'EXTERNAL_SERVICE_FAILED',
      title: 'Upstream dependency failed',
      type: 'https://agency.dev/problems/external-service-failed',
      detail,
      retryable: true,
    })
    this.name = 'ExternalServiceError'
  }
}

export class InternalServerError extends AppError {
  constructor(detail = 'An unexpected server error occurred.') {
    super({
      status: 500,
      code: 'INTERNAL_ERROR',
      title: 'Internal server error',
      type: 'https://agency.dev/problems/internal-error',
      detail,
    })
    this.name = 'InternalServerError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
