/**
 * Cost monitoring types for agency platform
 * 
 * Provides comprehensive cost tracking across storage, CI/CD, and bandwidth usage
 * with tenant isolation and security controls.
 */

import type { TenantId } from '@agency/database'

// Re-export TenantId for convenience
export type { TenantId }

/**
 * Core cost metrics interface
 * Tracks all cost-related data points with tenant isolation
 */
export interface CostMetrics {
  /** Unique identifier for the metric record */
  id: string
  /** Tenant this metric belongs to (for RLS isolation) */
  tenantId: TenantId
  /** Storage usage in bytes */
  storageUsage: number
  /** CI/CD runtime in minutes */
  cicdRuntime: number
  /** Bandwidth usage in bytes */
  bandwidthUsage: number
  /** Total calculated cost for the period */
  totalCost: number
  /** Currency code (USD, EUR, etc.) */
  currency: string
  /** Timestamp when metrics were collected */
  timestamp: string
  /** Metric collection period (hourly, daily, weekly, monthly) */
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  /** Additional metadata for the metric */
  metadata: Record<string, unknown>
}

/**
 * Budget alert configuration
 * Defines thresholds and alerting rules for cost monitoring
 */
export interface BudgetAlert {
  /** Unique identifier for the alert configuration */
  id: string
  /** Tenant this alert belongs to */
  tenantId: TenantId
  /** Alert name/description */
  name: string
  /** Cost category this alert monitors */
  category: 'storage' | 'compute' | 'bandwidth' | 'total'
  /** Alert threshold value */
  threshold: number
  /** Current usage value */
  current: number
  /** Alert threshold type */
  thresholdType: 'absolute' | 'percentage' | 'rate'
  /** Alert severity level */
  severity: 'low' | 'medium' | 'high' | 'critical'
  /** Whether this alert is currently active */
  active: boolean
  /** Alert notification channels */
  notificationChannels: NotificationChannel[]
  /** When this alert was last triggered */
  lastTriggered?: string
  /** Alert creation timestamp */
  createdAt: string
  /** Alert last updated timestamp */
  updatedAt: string
}

/**
 * Notification channel configuration
 */
export interface NotificationChannel {
  /** Channel type */
  type: 'email' | 'webhook' | 'slack' | 'teams'
  /** Channel destination/config */
  destination: string
  /** Whether this channel is enabled */
  enabled: boolean
}

/**
 * Storage usage details
 * Provides granular storage usage information
 */
export interface StorageUsage {
  /** Bucket name */
  bucket: string
  /** Total size in bytes */
  totalSize: number
  /** Number of files */
  fileCount: number
  /** Average file size in bytes */
  averageFileSize: number
  /** Largest file size in bytes */
  largestFileSize: number
  /** Usage timestamp */
  timestamp: string
}

/**
 * CI/CD usage details
 * Tracks GitHub Actions and other CI/CD costs
 */
export interface CicdUsage {
  /** Workflow name */
  workflowName: string
  /** Repository name */
  repository: string
  /** Runner type (ubuntu-latest, windows-latest, etc.) */
  runnerType: string
  /** Runtime in minutes */
  runtimeMinutes: number
  /** Number of job runs */
  jobRuns: number
  /** Cost per minute */
  costPerMinute: number
  /** Total cost for this workflow */
  totalCost: number
  /** Usage timestamp */
  timestamp: string
}

/**
 * Cost optimization recommendation
 * AI/ML-driven recommendations for cost optimization
 */
export interface OptimizationRecommendation {
  /** Unique identifier for the recommendation */
  id: string
  /** Tenant this recommendation belongs to */
  tenantId: TenantId
  /** Recommendation category */
  category: 'storage' | 'compute' | 'bandwidth' | 'general'
  /** Recommendation title */
  title: string
  /** Detailed description */
  description: string
  /** Estimated monthly savings */
  estimatedSavings: number
  /** Implementation difficulty */
  difficulty: 'easy' | 'medium' | 'hard'
  /** Implementation priority */
  priority: 'low' | 'medium' | 'high'
  /** Recommendation status */
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  /** Recommendation creation timestamp */
  createdAt: string
  /** When recommendation should be reviewed */
  reviewBy?: string
}

/**
 * Cost monitoring configuration
 * Global configuration for the monitoring system
 */
export interface MonitoringConfig {
  /** Data retention period in days */
  dataRetentionDays: number
  /** Default currency for cost calculations */
  defaultCurrency: string
  /** Cost collection intervals in hours */
  collectionIntervalHours: number
  /** Alert checking intervals in hours */
  alertCheckIntervalHours: number
  /** Whether automated optimization is enabled */
  autoOptimizationEnabled: boolean
  /** Rate limiting for external API calls */
  apiRateLimitPerHour: number
  /** Privacy settings */
  privacySettings: {
    /** Whether to store detailed billing information */
    storeDetailedBilling: boolean
    /** Whether to anonymize cost data */
    anonymizeData: boolean
  }
}

/**
 * Cost monitoring query filters
 */
export interface CostQueryFilters {
  /** Tenant ID filter */
  tenantId?: TenantId
  /** Date range filter */
  dateRange?: {
    start: string
    end: string
  }
  /** Cost category filter */
  category?: 'storage' | 'compute' | 'bandwidth' | 'total'
  /** Period filter */
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  /** Pagination */
  pagination?: {
    limit: number
    offset: number
  }
}

/**
 * Cost aggregation result
 * Used for dashboard analytics and reporting
 */
export interface CostAggregation {
  /** Aggregation period */
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  /** Total cost for the period */
  totalCost: number
  /** Cost breakdown by category */
  costBreakdown: {
    storage: number
    compute: number
    bandwidth: number
  }
  /** Trend data */
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentageChange: number
  }
  /** Number of data points in this aggregation */
  dataPoints: number
  /** Aggregation timestamp */
  timestamp: string
}
