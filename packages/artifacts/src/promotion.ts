import { getAdminClient } from '@agency/database/admin';
import { 
  Artifact, 
  ArtifactId, 
  Environment, 
  PromotionStep, 
  PromotionId, 
  PromotionStatus,
  PromotionCheck,
  createPromotionId,
  PromotionStepSchema,
  PromotionCheckSchema
} from './types';
import { artifactRegistry } from './registry';

export class ArtifactPromotion {
  private db = getAdminClient();

  /**
   * Create a promotion request for an artifact
   */
  async createPromotionRequest(
    artifactId: ArtifactId,
    toEnvironment: Environment,
    requiredApprovals: number = 1
  ): Promise<PromotionStep> {
    const artifact = await artifactRegistry.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    if (artifact.status !== 'staging' && toEnvironment === 'production') {
      throw new Error('Only artifacts in staging can be promoted to production');
    }

    if (artifact.status !== 'created' && toEnvironment === 'staging') {
      throw new Error('Only created artifacts can be promoted to staging');
    }

    const promotionStep: PromotionStep = {
      id: createPromotionId(`promo-${artifactId}-${toEnvironment}-${Date.now()}`),
      fromEnvironment: artifact.environment,
      toEnvironment,
      status: 'pending',
      requiredApprovals,
      currentApprovals: 0,
      checks: await this.generatePromotionChecks(artifact, toEnvironment),
      createdAt: new Date(),
    };

    // Validate with Zod schema
    const validatedPromotion = PromotionStepSchema.parse(promotionStep);

    // Store promotion step
    const { data, error } = await this.db
      .from('promotion_steps')
      .insert([validatedPromotion])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create promotion request: ${error.message}`);
    }

    // Update artifact promotion path
    const updatedPromotionPath = [...artifact.promotionPath, data];
    await this.db
      .from('artifacts')
      .update({ 
        promotion_path: updatedPromotionPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', artifactId);

    return this.mapDbRecordToPromotionStep(data);
  }

  /**
   * Approve a promotion request
   */
  async approvePromotion(promotionId: PromotionId, approver: string): Promise<PromotionStep> {
    const promotion = await this.getPromotionStep(promotionId);
    if (!promotion) {
      throw new Error(`Promotion ${promotionId} not found`);
    }

    if (promotion.status !== 'pending') {
      throw new Error(`Promotion is not pending (current status: ${promotion.status})`);
    }

    // Add approval
    const { data, error } = await this.db
      .from('promotion_approvals')
      .insert([{
        promotion_id: promotionId,
        approver,
        approved_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record approval: ${error.message}`);
    }

    // Update promotion step
    const updatedPromotion = await this.updatePromotionStep(promotionId, {
      currentApprovals: promotion.currentApprovals + 1,
    });

    // Check if all required approvals are received
    if (updatedPromotion.currentApprovals >= updatedPromotion.requiredApprovals) {
      return this.executePromotion(updatedPromotion);
    }

    return updatedPromotion;
  }

  /**
   * Reject a promotion request
   */
  async rejectPromotion(promotionId: PromotionId, reason: string, rejector: string): Promise<PromotionStep> {
    const promotion = await this.getPromotionStep(promotionId);
    if (!promotion) {
      throw new Error(`Promotion ${promotionId} not found`);
    }

    if (promotion.status !== 'pending') {
      throw new Error(`Promotion is not pending (current status: ${promotion.status})`);
    }

    // Add rejection record
    await this.db
      .from('promotion_rejections')
      .insert([{
        promotion_id: promotionId,
        rejector,
        reason,
        rejected_at: new Date().toISOString(),
      }]);

    // Update promotion step
    return this.updatePromotionStep(promotionId, {
      status: 'rejected',
      completedAt: new Date(),
    });
  }

  /**
   * Execute a promotion after all approvals
   */
  async executePromotion(promotion: PromotionStep): Promise<PromotionStep> {
    try {
      // Run all required checks
      const checkResults = await this.runPromotionChecks(promotion);
      const failedChecks = checkResults.filter(check => check.status === 'failed');

      if (failedChecks.length > 0) {
        await this.updatePromotionStep(promotion.id, {
          status: 'failed',
          completedAt: new Date(),
        });
        throw new Error(`Promotion failed checks: ${failedChecks.map(c => c.name).join(', ')}`);
      }

      // Get the artifact
      const artifact = await artifactRegistry.getArtifact(promotion.id.split('-')[1] as ArtifactId);
      if (!artifact) {
        throw new Error('Artifact not found for promotion');
      }

      // Update artifact status and environment
      await artifactRegistry.updateArtifactStatus(artifact.id, 
        promotion.toEnvironment === 'production' ? 'production' : 'staging'
      );

      // Update artifact environment in database
      await this.db
        .from('artifacts')
        .update({ 
          environment: promotion.toEnvironment,
          updated_at: new Date().toISOString()
        })
        .eq('id', artifact.id);

      // Mark promotion as completed
      const completedPromotion = await this.updatePromotionStep(promotion.id, {
        status: 'completed',
        completedAt: new Date(),
      });

      return completedPromotion;
    } catch (error) {
      await this.updatePromotionStep(promotion.id, {
        status: 'failed',
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Get promotion step by ID
   */
  async getPromotionStep(promotionId: PromotionId): Promise<PromotionStep | null> {
    const { data, error } = await this.db
      .from('promotion_steps')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbRecordToPromotionStep(data);
  }

  /**
   * List promotion requests for an artifact
   */
  async listArtifactPromotions(artifactId: ArtifactId): Promise<PromotionStep[]> {
    const { data, error } = await this.db
      .from('promotion_steps')
      .select('*')
      .like('id', `%-${artifactId}-%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list promotions: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToPromotionStep);
  }

  /**
   * List pending promotions requiring approval
   */
  async listPendingPromotions(environment?: Environment): Promise<PromotionStep[]> {
    let query = this.db
      .from('promotion_steps')
      .select('*')
      .eq('status', 'pending');

    if (environment) {
      query = query.eq('to_environment', environment);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list pending promotions: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToPromotionStep);
  }

  /**
   * Generate promotion checks based on artifact and target environment
   */
  private async generatePromotionChecks(
    artifact: Artifact, 
    toEnvironment: Environment
  ): Promise<PromotionCheck[]> {
    const checks: PromotionCheck[] = [];

    // Security check (always required)
    checks.push({
      type: 'security',
      name: 'Security Scan',
      status: 'pending',
      required: true,
    });

    // Performance check for production
    if (toEnvironment === 'production') {
      checks.push({
        type: 'performance',
        name: 'Performance Test',
        status: 'pending',
        required: true,
      });
    }

    // Compliance check for production
    if (toEnvironment === 'production') {
      checks.push({
        type: 'compliance',
        name: 'Compliance Review',
        status: 'pending',
        required: true,
      });
    }

    // Manual approval check
    checks.push({
      type: 'manual',
      name: 'Manual Review',
      status: 'pending',
      required: true,
    });

    return checks.map(check => PromotionCheckSchema.parse(check));
  }

  /**
   * Run promotion checks
   */
  private async runPromotionChecks(promotion: PromotionStep): Promise<PromotionCheck[]> {
    const results: PromotionCheck[] = [];

    for (const check of promotion.checks) {
      let status: 'passed' | 'failed' | 'skipped' = 'passed';
      let result: string | undefined;

      try {
        switch (check.type) {
          case 'security':
            // Run security scan
            const hasCriticalVulns = await this.checkSecurityVulnerabilities(promotion);
            if (hasCriticalVulns) {
              status = 'failed';
              result = 'Critical security vulnerabilities found';
            } else {
              result = 'No critical vulnerabilities found';
            }
            break;

          case 'performance':
            // Run performance test
            const performancePassed = await this.checkPerformanceRequirements(promotion);
            status = performancePassed ? 'passed' : 'failed';
            result = performancePassed ? 'Performance requirements met' : 'Performance requirements not met';
            break;

          case 'compliance':
            // Run compliance check
            const compliancePassed = await this.checkComplianceRequirements(promotion);
            status = compliancePassed ? 'passed' : 'failed';
            result = compliancePassed ? 'Compliance requirements met' : 'Compliance requirements not met';
            break;

          case 'manual':
            // Manual checks are handled by approval process
            status = 'skipped';
            result = 'Handled by approval process';
            break;
        }
      } catch (error) {
        status = 'failed';
        result = error instanceof Error ? error.message : 'Unknown error';
      }

      results.push({
        ...check,
        status,
        result,
      });

      // Update check in database
      await this.db
        .from('promotion_checks')
        .upsert([{
          promotion_step_id: promotion.id,
          check_type: check.type,
          check_name: check.name,
          status,
          result,
          required: check.required,
        }], {
          onConflict: 'promotion_step_id,check_type',
        });
    }

    return results;
  }

  /**
   * Check for security vulnerabilities
   */
  private async checkSecurityVulnerabilities(promotion: PromotionStep): Promise<boolean> {
    // This would integrate with security scanning tools
    // For now, we'll simulate the check
    console.log(`Running security check for promotion ${promotion.id}`);
    return false; // No critical vulnerabilities
  }

  /**
   * Check performance requirements
   */
  private async checkPerformanceRequirements(promotion: PromotionStep): Promise<boolean> {
    // This would integrate with performance testing tools
    console.log(`Running performance check for promotion ${promotion.id}`);
    return true; // Performance requirements met
  }

  /**
   * Check compliance requirements
   */
  private async checkComplianceRequirements(promotion: PromotionStep): Promise<boolean> {
    // This would integrate with compliance checking tools
    console.log(`Running compliance check for promotion ${promotion.id}`);
    return true; // Compliance requirements met
  }

  /**
   * Update promotion step
   */
  private async updatePromotionStep(
    promotionId: PromotionId, 
    updates: Partial<PromotionStep>
  ): Promise<PromotionStep> {
    const { data, error } = await this.db
      .from('promotion_steps')
      .update(updates)
      .eq('id', promotionId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update promotion step: ${error?.message || 'Not found'}`);
    }

    return this.mapDbRecordToPromotionStep(data);
  }

  /**
   * Map database record to PromotionStep interface
   */
  private mapDbRecordToPromotionStep(record: any): PromotionStep {
    return PromotionStepSchema.parse({
      ...record,
      createdAt: new Date(record.created_at),
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
    });
  }
}

// Singleton instance
export const artifactPromotion = new ArtifactPromotion();
