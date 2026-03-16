import { getAdminClient } from '@agency/database/admin';
import { 
  Artifact, 
  ArtifactId, 
  Environment, 
  RetentionPolicy, 
  PolicyId,
  RetentionPolicySchema
} from './types';
import { artifactRegistry } from './registry';

export class RetentionManager {
  private db = getAdminClient();

  /**
   * Create a retention policy
   */
  async createRetentionPolicy(policy: Omit<RetentionPolicy, 'id'>): Promise<RetentionPolicy> {
    const policyId = `retention-${policy.environment}-${Date.now()}` as PolicyId;
    
    const policyData = {
      ...policy,
      id: policyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Validate with Zod schema
    const validatedPolicy = RetentionPolicySchema.parse(policyData);

    // Store in database
    const { data, error } = await this.db
      .from('retention_policies')
      .insert([validatedPolicy])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create retention policy: ${error.message}`);
    }

    return this.mapDbRecordToRetentionPolicy(data);
  }

  /**
   * Get a retention policy by ID
   */
  async getRetentionPolicy(policyId: PolicyId): Promise<RetentionPolicy | null> {
    const { data, error } = await this.db
      .from('retention_policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbRecordToRetentionPolicy(data);
  }

  /**
   * List retention policies
   */
  async listRetentionPolicies(environment?: Environment): Promise<RetentionPolicy[]> {
    let query = this.db.from('retention_policies').select('*');

    if (environment) {
      query = query.eq('environment', environment);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list retention policies: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToRetentionPolicy);
  }

  /**
   * Update a retention policy
   */
  async updateRetentionPolicy(policyId: PolicyId, updates: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
    const { data, error } = await this.db
      .from('retention_policies')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', policyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update retention policy: ${error?.message || 'Not found'}`);
    }

    return this.mapDbRecordToRetentionPolicy(data);
  }

  /**
   * Delete a retention policy
   */
  async deleteRetentionPolicy(policyId: PolicyId): Promise<void> {
    const { error } = await this.db
      .from('retention_policies')
      .delete()
      .eq('id', policyId);

    if (error) {
      throw new Error(`Failed to delete retention policy: ${error.message}`);
    }
  }

  /**
   * Apply retention policies to artifacts
   */
  async applyRetentionPolicies(): Promise<RetentionReport> {
    const policies = await this.listRetentionPolicies();
    const report: RetentionReport = {
      evaluatedAt: new Date(),
      totalPolicies: policies.length,
      totalArtifactsEvaluated: 0,
      artifactsArchived: 0,
      artifactsDeleted: 0,
      artifactsRetained: 0,
      errors: [],
      details: [],
    };

    for (const policy of policies) {
      try {
        const policyReport = await this.applyRetentionPolicy(policy);
        report.totalArtifactsEvaluated += policyReport.totalArtifactsEvaluated;
        report.artifactsArchived += policyReport.artifactsArchived;
        report.artifactsDeleted += policyReport.artifactsDeleted;
        report.artifactsRetained += policyReport.artifactsRetained;
        report.details.push(policyReport);
      } catch (error) {
        report.errors.push({
          policyId: policy.id,
          policyName: policy.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return report;
  }

  /**
   * Apply a single retention policy
   */
  async applyRetentionPolicy(policy: RetentionPolicy): Promise<PolicyRetentionReport> {
    const report: PolicyRetentionReport = {
      policyId: policy.id,
      policyName: policy.name,
      environment: policy.environment,
      evaluatedAt: new Date(),
      totalArtifactsEvaluated: 0,
      artifactsArchived: 0,
      artifactsDeleted: 0,
      artifactsRetained: 0,
      details: [],
    };

    // Get artifacts for this environment
    const artifacts = await artifactRegistry.listArtifacts({
      environment: policy.environment,
    });

    report.totalArtifactsEvaluated = artifacts.length;

    // Group artifacts by name to apply version limits
    const artifactsByName = this.groupArtifactsByName(artifacts);

    for (const [name, artifactList] of Object.entries(artifactsByName)) {
      const artifactReport = await this.applyRetentionPolicyToArtifacts(name, artifactList, policy);
      report.artifactsArchived += artifactReport.archived;
      report.artifactsDeleted += artifactReport.deleted;
      report.artifactsRetained += artifactReport.retained;
      report.details.push(artifactReport);
    }

    return report;
  }

  /**
   * Apply retention policy to a group of artifacts with the same name
   */
  private async applyRetentionPolicyToArtifacts(
    name: string,
    artifacts: Artifact[],
    policy: RetentionPolicy
  ): Promise<ArtifactGroupRetentionReport> {
    const report: ArtifactGroupRetentionReport = {
      artifactName: name,
      totalVersions: artifacts.length,
      archived: 0,
      deleted: 0,
      retained: 0,
      actions: [],
    };

    // Sort artifacts by creation date (newest first)
    const sortedArtifacts = artifacts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply version limit
    const retainedByVersionLimit = sortedArtifacts.slice(0, policy.maxVersions);
    const excessByVersionLimit = sortedArtifacts.slice(policy.maxVersions);

    // Apply age limit
    const now = new Date();
    const maxAgeDate = new Date(now.getTime() - policy.maxAge * 24 * 60 * 60 * 1000);
    
    const retainedByAge = retainedByVersionLimit.filter(artifact => artifact.createdAt >= maxAgeDate);
    const excessByAge = retainedByVersionLimit.filter(artifact => artifact.createdAt < maxAgeDate);

    // Combine excess artifacts
    const allExcess = [...excessByVersionLimit, ...excessByAge];
    const finalRetained = sortedArtifacts.filter(artifact => !allExcess.includes(artifact));

    // Check for exceptions
    const finalExcess = allExcess.filter(artifact => 
      !this.matchesException(artifact.version, policy.exceptions)
    );

    // Apply retention actions
    for (const artifact of finalExcess) {
      const ageInDays = Math.floor((now.getTime() - artifact.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      
      if (ageInDays >= policy.deleteOlderThan) {
        await this.deleteArtifact(artifact);
        report.deleted++;
        report.actions.push({
          artifactId: artifact.id,
          version: artifact.version,
          action: 'deleted',
          reason: `Older than ${policy.deleteOlderThan} days`,
          ageInDays,
        });
      } else if (ageInDays >= policy.archiveOlderThan) {
        await this.archiveArtifact(artifact);
        report.archived++;
        report.actions.push({
          artifactId: artifact.id,
          version: artifact.version,
          action: 'archived',
          reason: `Older than ${policy.archiveOlderThan} days`,
          ageInDays,
        });
      }
    }

    report.retained = finalRetained.length;

    return report;
  }

  /**
   * Group artifacts by name
   */
  private groupArtifactsByName(artifacts: Artifact[]): Record<string, Artifact[]> {
    return artifacts.reduce((groups, artifact) => {
      if (!groups[artifact.name]) {
        groups[artifact.name] = [];
      }
      groups[artifact.name].push(artifact);
      return groups;
    }, {} as Record<string, Artifact[]>);
  }

  /**
   * Check if a version matches any exception pattern
   */
  private matchesException(version: string, exceptions: string[]): boolean {
    return exceptions.some(pattern => {
      // Simple glob-like matching
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(version);
    });
  }

  /**
   * Archive an artifact
   */
  private async archiveArtifact(artifact: Artifact): Promise<void> {
    await artifactRegistry.updateArtifactStatus(artifact.id, 'archived');
    console.log(`Archived artifact ${artifact.id} (${artifact.name}:${artifact.version})`);
  }

  /**
   * Delete an artifact
   */
  private async deleteArtifact(artifact: Artifact): Promise<void> {
    await artifactRegistry.deleteArtifact(artifact.id);
    console.log(`Deleted artifact ${artifact.id} (${artifact.name}:${artifact.version})`);
  }

  /**
   * Get retention statistics
   */
  async getRetentionStatistics(): Promise<RetentionStatistics> {
    const policies = await this.listRetentionPolicies();
    const stats: RetentionStatistics = {
      totalPolicies: policies.length,
      policiesByEnvironment: {} as Record<Environment, number>,
      totalArtifacts: 0,
      artifactsByEnvironment: {} as Record<Environment, number>,
      artifactsByStatus: {} as Record<string, number>,
      estimatedStorageSavings: 0,
    };

    // Count policies by environment
    for (const policy of policies) {
      stats.policiesByEnvironment[policy.environment] = 
        (stats.policiesByEnvironment[policy.environment] || 0) + 1;
    }

    // Get artifact statistics
    const artifactStats = await artifactRegistry.getStatistics();
    stats.totalArtifacts = artifactStats.total;
    stats.artifactsByEnvironment = artifactStats.byEnvironment;
    stats.artifactsByStatus = {
      created: artifactStats.byStatus.created,
      testing: artifactStats.byStatus.testing,
      staging: artifactStats.byStatus.staging,
      production: artifactStats.byStatus.production,
      archived: artifactStats.byStatus.archived,
      deprecated: artifactStats.byStatus.deprecated,
    };

    // Estimate storage savings (rough calculation)
    const avgArtifactSize = stats.totalArtifacts > 0 ? artifactStats.totalSize / stats.totalArtifacts : 0;
    const potentialDeletions = Math.floor(stats.totalArtifacts * 0.3); // Assume 30% could be deleted
    stats.estimatedStorageSavings = potentialDeletions * avgArtifactSize;

    return stats;
  }

  /**
   * Schedule retention policy execution
   */
  async scheduleRetentionExecution(intervalHours: number = 24): Promise<void> {
    // This would integrate with a job scheduler like Inngest
    console.log(`Scheduling retention policy execution every ${intervalHours} hours`);
  }

  /**
   * Map database record to RetentionPolicy interface
   */
  private mapDbRecordToRetentionPolicy(record: any): RetentionPolicy {
    return RetentionPolicySchema.parse({
      ...record,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }
}

// Type definitions for retention reports
export interface RetentionReport {
  evaluatedAt: Date;
  totalPolicies: number;
  totalArtifactsEvaluated: number;
  artifactsArchived: number;
  artifactsDeleted: number;
  artifactsRetained: number;
  errors: RetentionError[];
  details: PolicyRetentionReport[];
}

export interface RetentionError {
  policyId: PolicyId;
  policyName: string;
  error: string;
}

export interface PolicyRetentionReport {
  policyId: PolicyId;
  policyName: string;
  environment: Environment;
  evaluatedAt: Date;
  totalArtifactsEvaluated: number;
  artifactsArchived: number;
  artifactsDeleted: number;
  artifactsRetained: number;
  details: ArtifactGroupRetentionReport[];
}

export interface ArtifactGroupRetentionReport {
  artifactName: string;
  totalVersions: number;
  archived: number;
  deleted: number;
  retained: number;
  actions: ArtifactRetentionAction[];
}

export interface ArtifactRetentionAction {
  artifactId: ArtifactId;
  version: string;
  action: 'archived' | 'deleted' | 'retained';
  reason: string;
  ageInDays: number;
}

export interface RetentionStatistics {
  totalPolicies: number;
  policiesByEnvironment: Record<Environment, number>;
  totalArtifacts: number;
  artifactsByEnvironment: Record<Environment, number>;
  artifactsByStatus: Record<string, number>;
  estimatedStorageSavings: number;
}

// Singleton instance
export const retentionManager = new RetentionManager();
