// Experiment Framework Types
// Multi-tenant A/B testing and experimentation platform types

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type MetricType = 'count' | 'rate' | 'average' | 'sum';
export type EventType = 'started' | 'paused' | 'stopped' | 'variant_assigned' | 'metric_recorded';
export type AssignmentSource = 'server' | 'client';

// Core Experiment Types
export interface Experiment {
  id: string;
  tenant_id: string;
  
  // Basic information
  name: string;
  description?: string;
  key: string; // Unique identifier for feature flags
  
  // PICOT Framework
  population: string; // Who is being tested
  intervention: string; // What is being tested
  control: string; // Baseline comparison
  outcome_metric: string; // Primary success metric
  time_horizon: string; // Test duration or sample size
  
  // Configuration
  status: ExperimentStatus;
  traffic_percentage: number; // 0-100
  
  // Ownership
  owner_id?: string;
  hypothesis: string; // Clear hypothesis statement
  
  // Timestamps
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  tenant_id: string;
  
  name: string; // e.g., "Control", "Variant A"
  description?: string;
  key: string; // e.g., "control", "variant_a"
  is_control: boolean;
  traffic_percentage: number; // 0-100
  
  // Feature flag configuration
  configuration: Record<string, unknown>; // JSON payload for feature flags
  
  created_at: string;
  updated_at: string;
}

export interface ExperimentAssignment {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  
  // User identification (pseudonymized for privacy)
  user_pseudonym: string; // Hashed user identifier, not PII
  session_id?: string; // For anonymous user experiments
  
  // Assignment metadata
  assigned_at: string;
  assignment_source: AssignmentSource;
}

export interface ExperimentMetric {
  id: string;
  tenant_id: string;
  experiment_id: string;
  variant_id: string;
  
  // Metric information
  metric_name: string; // e.g., "conversion_rate", "click_through_rate"
  metric_value: number;
  metric_type: MetricType;
  
  // Statistical significance
  sample_size: number;
  confidence_level: number; // e.g., 0.95
  p_value?: number;
  is_significant: boolean;
  
  // Time window
  window_start: string;
  window_end: string;
  
  created_at: string;
}

export interface ExperimentEvent {
  id: string;
  tenant_id: string;
  experiment_id?: string;
  variant_id?: string;
  
  event_type: EventType;
  event_data: Record<string, unknown>;
  
  // User context (pseudonymized)
  user_pseudonym?: string;
  session_id?: string;
  
  created_at: string;
}

// API Request/Response Types
export interface CreateExperimentRequest {
  name: string;
  description?: string;
  key: string;
  
  // PICOT Framework
  population: string;
  intervention: string;
  control: string;
  outcome_metric: string;
  time_horizon: string;
  
  // Configuration
  traffic_percentage?: number;
  hypothesis: string;
  
  // Variants
  variants: Omit<ExperimentVariant, 'id' | 'experiment_id' | 'tenant_id' | 'created_at' | 'updated_at'>[];
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  hypothesis?: string;
  traffic_percentage?: number;
  status?: ExperimentStatus;
  started_at?: string;
  ended_at?: string;
}

export interface CreateVariantRequest {
  name: string;
  description?: string;
  key: string;
  is_control?: boolean;
  traffic_percentage?: number;
  configuration?: Record<string, unknown>;
}

export interface ExperimentAssignmentRequest {
  experiment_key: string;
  user_id: string;
  tenant_id?: string;
  session_id?: string;
}

export interface ExperimentAssignmentResponse {
  variant_key?: string;
  variant_config?: Record<string, unknown>;
  is_new_assignment: boolean;
}

// Dashboard Types
export interface ExperimentSummary {
  id: string;
  name: string;
  key: string;
  status: ExperimentStatus;
  traffic_percentage: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  
  // Quick stats
  total_assignments: number;
  total_variants: number;
  primary_metric?: string;
  is_significant?: boolean;
  
  // Owner info
  owner_name?: string;
}

export interface ExperimentDetail extends Experiment {
  variants: ExperimentVariant[];
  metrics: ExperimentMetric[];
  events: ExperimentEvent[];
  
  // Computed stats
  total_assignments: number;
  conversion_rate?: number;
  statistical_power?: number;
  confidence_interval?: [number, number];
}

export interface ExperimentListResponse {
  experiments: ExperimentSummary[];
  total: number;
  page: number;
  limit: number;
}

// Feature Flag Integration Types
export interface FeatureFlagConfig {
  enabled: boolean;
  variant?: string;
  config?: Record<string, unknown>;
}

export interface ExperimentFeatureFlag {
  experiment_key: string;
  feature_flag: FeatureFlagConfig;
}

// Analytics Integration Types
export interface ExperimentAnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  
  // Experiment context
  experiment_id?: string;
  variant_id?: string;
  experiment_key?: string;
  variant_key?: string;
}

// Error Types
export interface ExperimentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Validation Types
export interface ExperimentValidationRule {
  field: keyof Experiment | keyof ExperimentVariant;
  rule: 'required' | 'unique' | 'min' | 'max' | 'pattern';
  value?: unknown;
  message: string;
}

export interface ExperimentValidationResult {
  valid: boolean;
  errors: ExperimentValidationRule[];
}

// Statistical Types
export interface StatisticalTest {
  test_type: 't_test' | 'chi_square' | 'mann_whitney' | 'anova';
  alpha: number; // Significance level (e.g., 0.05)
  power: number; // Statistical power (e.g., 0.8)
  effect_size?: number;
  sample_size_required?: number;
}

export interface ExperimentResult {
  variant_id: string;
  variant_name: string;
  metric_value: number;
  confidence_interval: [number, number];
  p_value: number;
  is_significant: boolean;
  relative_lift?: number;
  absolute_lift?: number;
}

// Privacy and Compliance Types
export interface ExperimentPrivacySettings {
  data_retention_days: number;
  anonymize_ip_addresses: boolean;
  store_user_pseudonyms_only: boolean;
  gdpr_compliant: boolean;
  consent_required: boolean;
}

// PostHog Integration Types
export interface PostHogExperimentConfig {
  feature_flag_key: string;
  experiment_id: string;
  variants: Array<{
    key: string;
    rollout_percentage: number;
  }>;
  metrics: Array<{
    name: string;
    type: 'primary' | 'secondary' | 'guardrail';
  }>;
}

// Utility Types
export type ExperimentWithRelations = Experiment & {
  variants: ExperimentVariant[];
  assignments: ExperimentAssignment[];
  metrics: ExperimentMetric[];
};

export type VariantWithMetrics = ExperimentVariant & {
  metrics: ExperimentMetric[];
  assignments_count: number;
};

export type ExperimentStats = {
  total_experiments: number;
  running_experiments: number;
  completed_experiments: number;
  total_assignments: number;
  average_duration_days: number;
  statistical_power_avg: number;
};

// Form Types for UI
export interface ExperimentFormData {
  name: string;
  description: string;
  key: string;
  population: string;
  intervention: string;
  control: string;
  outcome_metric: string;
  time_horizon: string;
  traffic_percentage: number;
  hypothesis: string;
  variants: Array<{
    name: string;
    key: string;
    is_control: boolean;
    traffic_percentage: number;
    description: string;
    configuration: Record<string, unknown>;
  }>;
}

export interface ExperimentFilters {
  status?: ExperimentStatus[];
  owner_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Export all types for easy importing
export type {
  // Core types are already exported above
  
  // Re-export commonly used combinations
  ExperimentStatus,
  MetricType,
  EventType,
  AssignmentSource,
};

// Default values and constants
export const EXPERIMENT_DEFAULTS = {
  traffic_percentage: 100,
  confidence_level: 0.95,
  significance_level: 0.05,
  statistical_power: 0.8,
  data_retention_days: 365,
} as const;

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  draft: 'Draft',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
} as const;

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  count: 'Count',
  rate: 'Rate',
  average: 'Average',
  sum: 'Sum',
} as const;
