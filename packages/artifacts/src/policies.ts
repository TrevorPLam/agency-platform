import { getAdminClient } from '@agency/database/admin';
import { 
  Artifact, 
  PolicyRule, 
  PolicyId, 
  PolicyType, 
  PolicyCondition, 
  PolicyAction,
  createPolicyId,
  PolicyRuleSchema,
  PolicyConditionSchema,
  PolicyActionSchema
} from './types';

export class PolicyManager {
  private db = getAdminClient();

  /**
   * Create a new policy rule
   */
  async createPolicy(rule: Omit<PolicyRule, 'id'>): Promise<PolicyRule> {
    const policyId = createPolicyId(`policy-${rule.type}-${Date.now()}`);
    
    const policyData = {
      ...rule,
      id: policyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Validate with Zod schema
    const validatedPolicy = PolicyRuleSchema.parse(policyData);

    // Store in database
    const { data, error } = await this.db
      .from('policy_rules')
      .insert([validatedPolicy])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create policy: ${error.message}`);
    }

    return this.mapDbRecordToPolicyRule(data);
  }

  /**
   * Get a policy rule by ID
   */
  async getPolicy(policyId: PolicyId): Promise<PolicyRule | null> {
    const { data, error } = await this.db
      .from('policy_rules')
      .select('*')
      .eq('id', policyId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbRecordToPolicyRule(data);
  }

  /**
   * List policy rules with filtering
   */
  async listPolicies(filters: {
    type?: PolicyType;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PolicyRule[]> {
    let query = this.db.from('policy_rules').select('*');

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.enabled !== undefined) {
      query = query.eq('enabled', filters.enabled);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list policies: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToPolicyRule);
  }

  /**
   * Update a policy rule
   */
  async updatePolicy(policyId: PolicyId, updates: Partial<PolicyRule>): Promise<PolicyRule> {
    const { data, error } = await this.db
      .from('policy_rules')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', policyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update policy: ${error?.message || 'Not found'}`);
    }

    return this.mapDbRecordToPolicyRule(data);
  }

  /**
   * Delete a policy rule
   */
  async deletePolicy(policyId: PolicyId): Promise<void> {
    const { error } = await this.db
      .from('policy_rules')
      .delete()
      .eq('id', policyId);

    if (error) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Evaluate policies against an artifact
   */
  async evaluatePolicies(artifact: Artifact): Promise<PolicyEvaluationResult> {
    const policies = await this.listPolicies({ enabled: true });
    
    const results: PolicyEvaluationResult = {
      artifactId: artifact.id,
      artifactName: artifact.name,
      evaluatedAt: new Date(),
      totalPolicies: policies.length,
      passedPolicies: 0,
      failedPolicies: 0,
      blockedPolicies: 0,
      warnings: [],
      errors: [],
      blocked: false,
    };

    for (const policy of policies) {
      try {
        const evaluation = await this.evaluateSinglePolicy(policy, artifact);
        
        if (evaluation.passed) {
          results.passedPolicies++;
        } else {
          results.failedPolicies++;
          
          if (evaluation.blocked) {
            results.blockedPolicies++;
            results.blocked = true;
            results.errors.push({
              policyId: policy.id,
              policyName: policy.name,
              policyType: policy.type,
              message: evaluation.message,
              severity: 'error',
              action: evaluation.action,
            });
          } else {
            results.warnings.push({
              policyId: policy.id,
              policyName: policy.name,
              policyType: policy.type,
              message: evaluation.message,
              severity: 'warning',
              action: evaluation.action,
            });
          }
        }
      } catch (error) {
        results.failedPolicies++;
        results.errors.push({
          policyId: policy.id,
          policyName: policy.name,
          policyType: policy.type,
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error',
          action: { type: 'block', parameters: {} },
        });
      }
    }

    return results;
  }

  /**
   * Evaluate a single policy against an artifact
   */
  async evaluateSinglePolicy(policy: PolicyRule, artifact: Artifact): Promise<SinglePolicyEvaluation> {
    // Check all conditions
    const conditionResults = await Promise.all(
      policy.conditions.map(condition => this.evaluateCondition(condition, artifact))
    );

    // All conditions must pass for the policy to apply
    const allConditionsPassed = conditionResults.every(result => result.passed);

    if (!allConditionsPassed) {
      return {
        passed: true,
        blocked: false,
        message: 'Policy conditions not met',
        action: null,
      };
    }

    // Execute actions for matching conditions
    const actionResults = await Promise.all(
      policy.actions.map(action => this.executeAction(action, artifact))
    );

    // Check if any action blocks the artifact
    const blockingAction = actionResults.find(result => result.blocked);
    
    if (blockingAction) {
      return {
        passed: false,
        blocked: true,
        message: blockingAction.message,
        action: blockingAction.action,
      };
    }

    // Check if any action generates warnings
    const warningAction = actionResults.find(result => result.warning);
    
    if (warningAction) {
      return {
        passed: false,
        blocked: false,
        message: warningAction.message,
        action: warningAction.action,
      };
    }

    return {
      passed: true,
      blocked: false,
      message: 'Policy evaluated successfully',
      action: null,
    };
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(condition: PolicyCondition, artifact: Artifact): Promise<ConditionEvaluation> {
    let fieldValue: unknown;
    let artifactValue: unknown;

    // Get field value from artifact
    if (condition.field in artifact) {
      fieldValue = artifact[condition.field as keyof Artifact];
    } else if (condition.field in artifact.metadata) {
      fieldValue = artifact.metadata[condition.field as keyof typeof artifact.metadata];
    } else {
      return {
        passed: false,
        message: `Field '${condition.field}' not found in artifact`,
      };
    }

    // Convert both values to appropriate type for comparison
    artifactValue = this.normalizeValue(fieldValue);
    const conditionValue = this.normalizeValue(condition.value);

    // Evaluate condition
    let passed = false;
    switch (condition.operator) {
      case 'equals':
        passed = artifactValue === conditionValue;
        break;
      case 'contains':
        passed = typeof artifactValue === 'string' && 
                  typeof conditionValue === 'string' && 
                  artifactValue.includes(conditionValue);
        break;
      case 'startsWith':
        passed = typeof artifactValue === 'string' && 
                  typeof conditionValue === 'string' && 
                  artifactValue.startsWith(conditionValue);
        break;
      case 'endsWith':
        passed = typeof artifactValue === 'string' && 
                  typeof conditionValue === 'string' && 
                  artifactValue.endsWith(conditionValue);
        break;
      case 'greaterThan':
        passed = typeof artifactValue === 'number' && 
                  typeof conditionValue === 'number' && 
                  artifactValue > conditionValue;
        break;
      case 'lessThan':
        passed = typeof artifactValue === 'number' && 
                  typeof conditionValue === 'number' && 
                  artifactValue < conditionValue;
        break;
    }

    return {
      passed,
      message: passed ? 
        `Condition met: ${condition.field} ${condition.operator} ${conditionValue}` :
        `Condition failed: ${condition.field} ${condition.operator} ${conditionValue}`,
    };
  }

  /**
   * Execute a policy action
   */
  private async executeAction(action: PolicyAction, artifact: Artifact): Promise<ActionEvaluation> {
    switch (action.type) {
      case 'block':
        return {
          blocked: true,
          warning: false,
          message: action.parameters.message as string || 'Artifact blocked by policy',
          action,
        };

      case 'warn':
        return {
          blocked: false,
          warning: true,
          message: action.parameters.message as string || 'Policy warning',
          action,
        };

      case 'tag':
        await this.tagArtifact(artifact, action.parameters.tags as string[]);
        return {
          blocked: false,
          warning: false,
          message: `Artifact tagged with: ${(action.parameters.tags as string[]).join(', ')}`,
          action,
        };

      case 'notify':
        await this.sendNotification(artifact, action.parameters);
        return {
          blocked: false,
          warning: false,
          message: 'Notification sent',
          action,
        };

      case 'archive':
        await this.archiveArtifact(artifact);
        return {
          blocked: false,
          warning: false,
          message: 'Artifact archived',
          action,
        };

      case 'delete':
        await this.deleteArtifact(artifact);
        return {
          blocked: true,
          warning: false,
          message: 'Artifact deleted by policy',
          action,
        };

      default:
        return {
          blocked: false,
          warning: false,
          message: `Unknown action type: ${action.type}`,
          action,
        };
    }
  }

  /**
   * Tag an artifact
   */
  private async tagArtifact(artifact: Artifact, tags: string[]): Promise<void> {
    // This would update the artifact's metadata tags
    console.log(`Tagging artifact ${artifact.id} with tags: ${tags.join(', ')}`);
  }

  /**
   * Send notification
   */
  private async sendNotification(artifact: Artifact, parameters: Record<string, unknown>): Promise<void> {
    // This would integrate with notification systems
    const message = parameters.message as string || 'Policy notification';
    const recipients = parameters.recipients as string[] || [];
    console.log(`Sending notification for artifact ${artifact.id}: ${message} to ${recipients.join(', ')}`);
  }

  /**
   * Archive an artifact
   */
  private async archiveArtifact(artifact: Artifact): Promise<void> {
    // This would update the artifact status to archived
    console.log(`Archiving artifact ${artifact.id}`);
  }

  /**
   * Delete an artifact
   */
  private async deleteArtifact(artifact: Artifact): Promise<void> {
    // This would delete the artifact
    console.log(`Deleting artifact ${artifact.id}`);
  }

  /**
   * Normalize value for comparison
   */
  private normalizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  }

  /**
   * Map database record to PolicyRule interface
   */
  private mapDbRecordToPolicyRule(record: any): PolicyRule {
    return PolicyRuleSchema.parse({
      ...record,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }
}

// Type definitions for evaluation results
export interface PolicyEvaluationResult {
  artifactId: string;
  artifactName: string;
  evaluatedAt: Date;
  totalPolicies: number;
  passedPolicies: number;
  failedPolicies: number;
  blockedPolicies: number;
  warnings: PolicyIssue[];
  errors: PolicyIssue[];
  blocked: boolean;
}

export interface PolicyIssue {
  policyId: PolicyId;
  policyName: string;
  policyType: PolicyType;
  message: string;
  severity: 'warning' | 'error';
  action: PolicyAction | null;
}

export interface SinglePolicyEvaluation {
  passed: boolean;
  blocked: boolean;
  message: string;
  action: PolicyAction | null;
}

export interface ConditionEvaluation {
  passed: boolean;
  message: string;
}

export interface ActionEvaluation {
  blocked: boolean;
  warning: boolean;
  message: string;
  action: PolicyAction;
}

// Singleton instance
export const policyManager = new PolicyManager();
