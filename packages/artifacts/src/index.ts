// Core types and interfaces
export * from './types';

// Registry functionality
export { ArtifactRegistry, artifactRegistry } from './registry';

// Promotion functionality
export { ArtifactPromotion, artifactPromotion } from './promotion';

// Policy management
export { PolicyManager, policyManager } from './policies';

// Retention management
export { RetentionManager, retentionManager } from './retention';

// Lifecycle management
export { ArtifactLifecycleManager, artifactLifecycle } from './lifecycle';
export { notificationHook, metricsHook, securityHook } from './lifecycle';

// SBOM generation
export { SBOMGenerator, sbomGenerator } from './sbom';
export type { SBOMComponent, SBOMDocument } from './sbom';

// Re-export evaluation types
export type {
  PolicyEvaluationResult,
  PolicyIssue,
  SinglePolicyEvaluation,
  ConditionEvaluation,
  ActionEvaluation,
} from './policies';

export type {
  RetentionReport,
  RetentionError,
  PolicyRetentionReport,
  ArtifactGroupRetentionReport,
  ArtifactRetentionAction,
  RetentionStatistics,
} from './retention';
