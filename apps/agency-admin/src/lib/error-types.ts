export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly type: string
  readonly title: string
  readonly detail: string

  constructor(params: {
    status: number
    code: string
    type: string
    title: string
    detail: string
  }) {
    super(params.detail)
    this.name = 'AppError'
    this.status = params.status
    this.code = params.code
    this.type = params.type
    this.title = params.title
    this.detail = params.detail
  }
}

export class AuthenticationError extends AppError {
  constructor(detail = 'Authentication is required to access this resource.') {
    super({
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
      type: 'https://agency.dev/problems/authentication-required',
      title: 'Authentication required',
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
      type: 'https://agency.dev/problems/authorization-denied',
      title: 'Access denied',
      detail,
    })
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends AppError {
  constructor(detail = 'The request payload is invalid.') {
    super({
      status: 400,
      code: 'VALIDATION_FAILED',
      type: 'https://agency.dev/problems/validation-failed',
      title: 'Validation failed',
      detail,
    })
    this.name = 'ValidationError'
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(detail = 'The requested resource was not found.') {
    super({
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      type: 'https://agency.dev/problems/resource-not-found',
      title: 'Resource not found',
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
      type: 'https://agency.dev/problems/database-operation-failed',
      title: 'Database operation failed',
      detail,
    })
    this.name = 'DatabaseOperationError'
  }
}

export class TenantResolutionError extends AppError {
  constructor(detail = 'Unable to resolve tenant context for this request.') {
    super({
      status: 503,
      code: 'TENANT_RESOLUTION_FAILED',
      type: 'https://agency.dev/problems/tenant-resolution-failed',
      title: 'Tenant resolution failed',
      detail,
    })
    this.name = 'TenantResolutionError'
  }
}

export class InternalServerError extends AppError {
  constructor(detail = 'An unexpected server error occurred.') {
    super({
      status: 500,
      code: 'INTERNAL_ERROR',
      type: 'https://agency.dev/problems/internal-error',
      title: 'Internal server error',
      detail,
    })
    this.name = 'InternalServerError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
