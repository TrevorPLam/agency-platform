/**
 * Shared API Types for Cost Management
 * 
 * This file contains TypeScript interfaces and types that define
 * the contract between the cost management dashboard and API routes.
 * 
 * These types ensure type safety across the client-server boundary
 * and serve as documentation for the API contracts.
 */

// Base API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success?: boolean
}

export interface ApiError {
  error: string
  status: number
  timestamp: string
}

// Cost Management Types
export interface CostSummary {
  totalCost: number
  storageCost: number
  cicdCost: number
  bandwidthCost: number
  averageDailyCost: number
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
}

export interface CostMetrics {
  id: string
  storageUsage: number
  cicdRuntime: number
  bandwidthUsage: number
  totalCost: number
  currency: string
  timestamp: string
  period: 'daily' | 'weekly' | 'monthly'
  metadata: Record<string, unknown>
}

export interface BudgetAlert {
  id: string
  tenantId: string
  name: string
  category: 'storage' | 'compute' | 'bandwidth' | 'total'
  threshold: number
  current: number
  thresholdType: 'absolute' | 'percentage'
  severity: 'low' | 'medium' | 'high' | 'critical'
  active: boolean
  notificationChannels: string[]
  lastTriggered?: string
  createdAt: string
  updatedAt: string
}

export interface OptimizationRecommendation {
  id: string
  tenantId: string
  category: 'storage' | 'compute' | 'bandwidth' | 'general'
  title: string
  description: string
  estimatedSavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  createdAt: string
  reviewBy?: string
}

// API Request/Response Types
export interface CostSummaryResponse extends ApiResponse<CostSummary> {}
export interface CostMetricsResponse extends ApiResponse<CostMetrics[]> {}
export interface BudgetAlertsResponse extends ApiResponse<BudgetAlert[]> {}
export interface OptimizationRecommendationsResponse extends ApiResponse<OptimizationRecommendation[]> {}

// API Request Payload Types
export interface CreateMetricRequest {
  tenantId?: string
  storageUsage?: number
  cicdRuntime?: number
  bandwidthUsage?: number
  totalCost?: number
  currency?: string
  period?: 'daily' | 'weekly' | 'monthly'
  metadata?: Record<string, unknown>
}

export interface CreateAlertRequest {
  tenantId?: string
  name: string
  category: 'storage' | 'compute' | 'bandwidth' | 'total'
  threshold: number
  thresholdType?: 'absolute' | 'percentage'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  active?: boolean
  notificationChannels?: string[]
}

export interface CreateRecommendationRequest {
  tenantId?: string
  category: 'storage' | 'compute' | 'bandwidth' | 'general'
  title: string
  description: string
  estimatedSavings?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  reviewBy?: string
}

export interface UpdateRecommendationRequest {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
}

// Query Parameter Types
export interface CostSummaryQuery {
  tenant_id?: string
}

export interface CostMetricsQuery {
  tenant_id?: string
  period?: 'daily' | 'weekly' | 'monthly'
  days?: number
}

export interface BudgetAlertsQuery {
  tenant_id?: string
  active?: boolean
}

export interface OptimizationRecommendationsQuery {
  tenant_id?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  priority?: 'low' | 'medium' | 'high'
}

// Error Types for Better Client Handling
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message = 'Invalid data provided') {
    super(message)
    this.name = 'ValidationError'
  }
}

// Utility Functions for Error Handling
export function createApiError(status: number, message: string): ApiError {
  return {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  }
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

// API Endpoint Constants
export const COST_API_ENDPOINTS = {
  SUMMARY: '/api/costs/summary',
  METRICS: '/api/costs/metrics',
  ALERTS: '/api/costs/alerts',
  RECOMMENDATIONS: '/api/costs/recommendations',
} as const

// HTTP Status Code Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const
