import { z } from 'zod';

// Branded types for nominal typing
type Brand<T, B> = T & { __brand: B };

export type ArtifactId = Brand<string, 'ArtifactId'>;
export type PromotionId = Brand<string, 'PromotionId'>;
export type PolicyId = Brand<string, 'PolicyId'>;

// Create branded type helpers
export const createArtifactId = (id: string): ArtifactId => id as ArtifactId;
export const createPromotionId = (id: string): PromotionId => id as PromotionId;
export const createPolicyId = (id: string): PolicyId => id as PolicyId;

// Artifact types using discriminated unions
export type ArtifactType = 'package' | 'container' | 'binary' | 'document';

export type ArtifactStatus = 'created' | 'testing' | 'staging' | 'production' | 'archived' | 'deprecated';

export type Environment = 'development' | 'staging' | 'production';

export type PromotionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';

export type PolicyType = 'retention' | 'promotion' | 'security' | 'compliance';

// Core interfaces
export interface Artifact {
  id: ArtifactId;
  name: string;
  version: string;
  type: ArtifactType;
  status: ArtifactStatus;
  environment: Environment;
  integrity: string; // SHA-256 hash
  size: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: ArtifactMetadata;
  promotionPath: PromotionStep[];
  retentionPolicy: RetentionPolicy;
}

export interface ArtifactMetadata {
  buildId: string;
  commitSha: string;
  branch: string;
  author: string;
  description?: string;
  tags: string[];
  dependencies: string[];
  vulnerabilities: Vulnerability[];
  sbom?: SBOMInfo;
}

export interface PromotionStep {
  id: PromotionId;
  fromEnvironment: Environment;
  toEnvironment: Environment;
  status: PromotionStatus;
  requiredApprovals: number;
  currentApprovals: number;
  checks: PromotionCheck[];
  createdAt: Date;
  completedAt?: Date;
}

export interface PromotionCheck {
  type: 'security' | 'performance' | 'compliance' | 'manual';
  name: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  result?: string;
  required: boolean;
}

export interface RetentionPolicy {
  id: PolicyId;
  name: string;
  environment: Environment;
  maxAge: number; // days
  maxVersions: number;
  archiveOlderThan: number; // days
  deleteOlderThan: number; // days
  exceptions: string[]; // version patterns to keep
}

export interface PolicyRule {
  id: PolicyId;
  type: PolicyType;
  name: string;
  description: string;
  enabled: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
}

export interface PolicyCondition {
  field: keyof Artifact | keyof ArtifactMetadata;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string | number | boolean;
}

export interface PolicyAction {
  type: 'block' | 'warn' | 'tag' | 'notify' | 'archive' | 'delete';
  parameters: Record<string, unknown>;
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  package: string;
  version: string;
  fixedIn?: string;
}

export interface SBOMInfo {
  format: 'cyclonedx' | 'spdx';
  url: string;
  generatedAt: Date;
  components: number;
  vulnerabilities: number;
}

// Zod schemas for validation
export const ArtifactIdSchema = z.string().transform(createArtifactId);
export const PromotionIdSchema = z.string().transform(createPromotionId);
export const PolicyIdSchema = z.string().transform(createPolicyId);

export const ArtifactTypeSchema = z.enum(['package', 'container', 'binary', 'document']);
export const ArtifactStatusSchema = z.enum(['created', 'testing', 'staging', 'production', 'archived', 'deprecated']);
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);
export const PromotionStatusSchema = z.enum(['pending', 'approved', 'rejected', 'completed', 'failed']);
export const PolicyTypeSchema = z.enum(['retention', 'promotion', 'security', 'compliance']);

export const VulnerabilitySchema = z.object({
  id: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  package: z.string(),
  version: z.string(),
  fixedIn: z.string().optional(),
});

export const SBOMInfoSchema = z.object({
  format: z.enum(['cyclonedx', 'spdx']),
  url: z.string(),
  generatedAt: z.date(),
  components: z.number(),
  vulnerabilities: z.number(),
});

export const ArtifactMetadataSchema = z.object({
  buildId: z.string(),
  commitSha: z.string(),
  branch: z.string(),
  author: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  dependencies: z.array(z.string()),
  vulnerabilities: z.array(VulnerabilitySchema),
  sbom: SBOMInfoSchema.optional(),
});

export const PromotionCheckSchema = z.object({
  type: z.enum(['security', 'performance', 'compliance', 'manual']),
  name: z.string(),
  status: z.enum(['pending', 'passed', 'failed', 'skipped']),
  result: z.string().optional(),
  required: z.boolean(),
});

export const PromotionStepSchema = z.object({
  id: PromotionIdSchema,
  fromEnvironment: EnvironmentSchema,
  toEnvironment: EnvironmentSchema,
  status: PromotionStatusSchema,
  requiredApprovals: z.number(),
  currentApprovals: z.number(),
  checks: z.array(PromotionCheckSchema),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export const RetentionPolicySchema = z.object({
  id: PolicyIdSchema,
  name: z.string(),
  environment: EnvironmentSchema,
  maxAge: z.number(),
  maxVersions: z.number(),
  archiveOlderThan: z.number(),
  deleteOlderThan: z.number(),
  exceptions: z.array(z.string()),
});

export const PolicyConditionSchema = z.object({
  field: z.union([
    z.literal('id'),
    z.literal('name'),
    z.literal('version'),
    z.literal('type'),
    z.literal('status'),
    z.literal('environment'),
    z.literal('integrity'),
    z.literal('size'),
    z.literal('createdAt'),
    z.literal('updatedAt'),
    z.literal('buildId'),
    z.literal('commitSha'),
    z.literal('branch'),
    z.literal('author'),
  ]),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const PolicyActionSchema = z.object({
  type: z.enum(['block', 'warn', 'tag', 'notify', 'archive', 'delete']),
  parameters: z.record(z.unknown()),
});

export const PolicyRuleSchema = z.object({
  id: PolicyIdSchema,
  type: PolicyTypeSchema,
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  conditions: z.array(PolicyConditionSchema),
  actions: z.array(PolicyActionSchema),
});

export const ArtifactSchema = z.object({
  id: ArtifactIdSchema,
  name: z.string(),
  version: z.string(),
  type: ArtifactTypeSchema,
  status: ArtifactStatusSchema,
  environment: EnvironmentSchema,
  integrity: z.string(),
  size: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: ArtifactMetadataSchema,
  promotionPath: z.array(PromotionStepSchema),
  retentionPolicy: RetentionPolicySchema,
});

// Template literal types for domain-specific validation
export type ArtifactName = `${string}-${string}-${string}`; // name-version-environment pattern
export type VersionString = `${number}.${number}.${number}${string}`; // semver pattern
export type IntegrityHash = `sha256:${string}`; // SHA-256 hash pattern

// Helper functions
export const isValidArtifactName = (name: string): name is ArtifactName => {
  return /^[a-z0-9-]+-[0-9]+\.[0-9]+\.[0-9]+-[a-z]+$/.test(name);
};

export const isValidVersion = (version: string): version is VersionString => {
  return /^\d+\.\d+\.[0-9]+/.test(version);
};

export const isValidIntegrityHash = (hash: string): hash is IntegrityHash => {
  return /^sha256:[a-f0-9]{64}$/.test(hash);
};

// Lifecycle management types
export type LifecycleEventId = Brand<string, 'LifecycleEventId'>;

export const createLifecycleEventId = (id: string): LifecycleEventId => id as LifecycleEventId;

export type LifecycleEventType =
  | 'registered'
  | 'testing_started'
  | 'testing_completed'
  | 'promoted'
  | 'archived'
  | 'decommissioned'
  | 'maintenance_completed'
  | 'security_scan_completed'
  | 'vulnerability_detected';

export interface LifecycleEvent {
  id: LifecycleEventId;
  artifactId: ArtifactId;
  type: LifecycleEventType;
  timestamp: Date;
  data: Record<string, any>;
  tenantId: string;
}

export interface LifecycleHook {
  id: string;
  description: string;
  handler: (event: LifecycleEvent) => Promise<void>;
}

// Zod schemas for lifecycle types
export const LifecycleEventIdSchema = z.string().regex(/^lifecycle-[a-f0-9-]+$/);

export const LifecycleEventTypeSchema = z.enum([
  'registered',
  'testing_started',
  'testing_completed',
  'promoted',
  'archived',
  'decommissioned',
  'maintenance_completed',
  'security_scan_completed',
  'vulnerability_detected',
]);

export const LifecycleEventSchema = z.object({
  id: LifecycleEventIdSchema,
  artifactId: ArtifactIdSchema,
  type: LifecycleEventTypeSchema,
  timestamp: z.date(),
  data: z.record(z.unknown()),
  tenantId: z.string(),
});

export const LifecycleHookSchema = z.object({
  id: z.string(),
  description: z.string(),
  handler: z.function().args(z.any()).returns(z.promise(z.void())),
});
