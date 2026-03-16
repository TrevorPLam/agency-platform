/**
 * @agency/metrics - DORA Metrics Types
 *
 * Type definitions for DORA (DevOps Research and Assessment) metrics
 * following industry standards and best practices.
 */

/**
 * Core DORA metrics interface
 */
export interface DORAMetrics {
  /** Number of deployments per time period (days/weeks/months) */
  deploymentFrequency: number;
  /** Time from code commit to production deployment (in hours) */
  leadTimeForChanges: number;
  /** Percentage of deployments that cause failures (0-100) */
  changeFailureRate: number;
  /** Time to restore service after failure (in hours) */
  meanTimeToRecovery: number;
}

/**
 * Time series metric snapshot for historical tracking
 */
export interface MetricSnapshot {
  /** ISO 8601 timestamp of the measurement */
  timestamp: string;
  /** Metric value */
  value: number;
  /** Additional metadata for context */
  metadata: Record<string, unknown>;
  /** Metric type identifier */
  metricType: DORAMetricType;
}

/**
 * Individual DORA metric types
 */
export type DORAMetricType = 
  | 'deployment-frequency'
  | 'lead-time-for-changes'
  | 'change-failure-rate'
  | 'mean-time-to-recovery';

/**
 * Performance level benchmarks based on DORA research
 */
export interface PerformanceLevel {
  /** Performance level name */
  level: 'Elite' | 'High' | 'Medium' | 'Low';
  /** Minimum threshold for this level */
  minThreshold: number;
  /** Maximum threshold for this level */
  maxThreshold: number;
  /** Description of what this level represents */
  description: string;
}

/**
 * Deployment event data for tracking
 */
export interface DeploymentEvent {
  /** Unique identifier for the deployment */
  id: string;
  /** Deployment timestamp */
  timestamp: string;
  /** Git commit SHA */
  commitSha: string;
  /** Deployment environment */
  environment: 'production' | 'staging' | 'development';
  /** Application/service being deployed */
  service: string;
  /** Deployment status */
  status: 'success' | 'failure' | 'rollback';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Incident data for failure rate and MTTR calculations
 */
export interface IncidentEvent {
  /** Unique identifier for the incident */
  id: string;
  /** Incident detection timestamp */
  detectedAt: string;
  /** Incident resolution timestamp (null if ongoing) */
  resolvedAt: string | null;
  /** Incident severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Associated deployment that caused the incident (if known) */
  deploymentId?: string;
  /** Incident description */
  description: string;
  /** Service/application affected */
  service: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Pull request data for lead time calculations
 */
export interface PullRequestEvent {
  /** Unique identifier for the PR */
  id: string;
  /** PR number */
  number: number;
  /** First commit timestamp in the PR */
  firstCommitAt: string;
  /** PR creation timestamp */
  createdAt: string;
  /** PR merge timestamp (null if not merged) */
  mergedAt: string | null;
  /** Target branch */
  baseBranch: string;
  /** Source branch */
  headBranch: string;
  /** Associated deployment (if deployed) */
  deploymentId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Metrics calculation configuration
 */
export interface MetricsConfig {
  /** Time window for calculations (in days) */
  timeWindowDays: number;
  /** Environments to include in calculations */
  environments: string[];
  /** Services to include (empty = all) */
  services: string[];
  /** Performance thresholds for alerts */
  alertThresholds: {
    deploymentFrequency: number; // deployments per week
    leadTimeForChanges: number; // hours
    changeFailureRate: number; // percentage
    meanTimeToRecovery: number; // hours
  };
}

/**
 * Metrics calculation result with context
 */
export interface MetricsResult {
  /** Calculated metrics */
  metrics: DORAMetrics;
  /** Performance levels for each metric */
  performanceLevels: Record<DORAMetricType, PerformanceLevel>;
  /** Time period covered */
  period: {
    start: string;
    end: string;
  };
  /** Number of data points used */
  dataPoints: {
    deployments: number;
    incidents: number;
    pullRequests: number;
  };
  /** Calculation timestamp */
  calculatedAt: string;
}
