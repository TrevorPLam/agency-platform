import { getAdminClient } from '@agency/database/admin';
import { 
  Artifact, 
  ArtifactId, 
  Environment, 
  ArtifactStatus,
  LifecycleEvent,
  LifecycleHook,
  createLifecycleEventId
} from './types';
import { artifactRegistry } from './registry';
import { artifactPromotion } from './promotion';
import { retentionManager } from './retention';

export class ArtifactLifecycleManager {
  private db = getAdminClient();
  private hooks: Map<string, LifecycleHook[]> = new Map();

  /**
   * Register a lifecycle hook for artifact events
   */
  registerHook(eventType: string, hook: LifecycleHook): void {
    const existing = this.hooks.get(eventType) || [];
    existing.push(hook);
    this.hooks.set(eventType, existing);
  }

  /**
   * Unregister a lifecycle hook
   */
  unregisterHook(eventType: string, hookId: string): void {
    const existing = this.hooks.get(eventType) || [];
    const filtered = existing.filter(hook => hook.id !== hookId);
    this.hooks.set(eventType, filtered);
  }

  /**
   * Execute lifecycle hooks for an event
   */
  private async executeHooks(event: LifecycleEvent): Promise<void> {
    const hooks = this.hooks.get(event.type) || [];
    
    for (const hook of hooks) {
      try {
        await hook.handler(event);
      } catch (error) {
        console.error(`Lifecycle hook ${hook.id} failed:`, error);
        // Don't throw - hooks should be non-blocking
      }
    }
  }

  /**
   * Record a lifecycle event
   */
  private async recordEvent(event: LifecycleEvent): Promise<void> {
    const { data, error } = await this.db
      .from('lifecycle_events')
      .insert([{
        id: event.id,
        artifact_id: event.artifactId,
        type: event.type,
        data: event.data,
        created_at: event.timestamp,
        tenant_id: event.tenantId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to record lifecycle event:', error);
    }
  }

  /**
   * Complete artifact lifecycle: register → test → promote → maintain
   */
  async processArtifactLifecycle(
    name: string,
    version: string,
    type: 'package' | 'container' | 'binary' | 'document',
    content: Buffer | string,
    metadata: Record<string, any>,
    targetEnvironments: Environment[] = ['development', 'staging', 'production']
  ): Promise<Artifact> {
    const tenantId = metadata.tenantId || 'default';

    // Step 1: Register artifact
    const artifact = await artifactRegistry.registerArtifact(
      name,
      version,
      type,
      targetEnvironments[0], // Start with first environment
      content,
      metadata
    );

    // Record registration event
    const registrationEvent: LifecycleEvent = {
      id: createLifecycleEventId(),
      artifactId: artifact.id,
      type: 'registered',
      timestamp: new Date(),
      data: {
        environment: artifact.environment,
        size: artifact.size,
        integrity: artifact.integrity,
      },
      tenantId,
    };

    await this.recordEvent(registrationEvent);
    await this.executeHooks(registrationEvent);

    // Step 2: Update status to testing
    await artifactRegistry.updateArtifactStatus(artifact.id, 'testing');

    const testingEvent: LifecycleEvent = {
      id: createLifecycleEventId(),
      artifactId: artifact.id,
      type: 'testing_started',
      timestamp: new Date(),
      data: {
        environment: artifact.environment,
      },
      tenantId,
    };

    await this.recordEvent(testingEvent);
    await this.executeHooks(testingEvent);

    // Step 3: Simulate testing (in real implementation, this would wait for test results)
    // For now, we'll auto-advance to staging
    await this.advanceToNextEnvironment(artifact, targetEnvironments);

    return artifact;
  }

  /**
   * Advance artifact through promotion pipeline
   */
  private async advanceToNextEnvironment(
    artifact: Artifact,
    targetEnvironments: Environment[]
  ): Promise<void> {
    const currentIndex = targetEnvironments.indexOf(artifact.environment);
    
    if (currentIndex < targetEnvironments.length - 1) {
      const nextEnvironment = targetEnvironments[currentIndex + 1];
      
      // Create promotion request
      const promotion = await artifactPromotion.createPromotionRequest(
        artifact.id,
        nextEnvironment,
        1 // Auto-approve for lifecycle management
      );

      // Auto-approve (in real implementation, this might wait for manual approval)
      await artifactPromotion.approvePromotion(promotion.id, 'lifecycle-manager');

      const promotionEvent: LifecycleEvent = {
        id: createLifecycleEventId(),
        artifactId: artifact.id,
        type: 'promoted',
        timestamp: new Date(),
        data: {
          fromEnvironment: artifact.environment,
          toEnvironment: nextEnvironment,
          promotionId: promotion.id,
        },
        tenantId: artifact.metadata.tenantId || 'default',
      };

      await this.recordEvent(promotionEvent);
      await this.executeHooks(promotionEvent);

      // Continue to next environment if needed
      const updatedArtifact = await artifactRegistry.getArtifact(artifact.id);
      if (updatedArtifact && currentIndex + 1 < targetEnvironments.length - 1) {
        await this.advanceToNextEnvironment(updatedArtifact, targetEnvironments);
      }
    }
  }

  /**
   * Get artifact lifecycle history
   */
  async getLifecycleHistory(artifactId: ArtifactId): Promise<LifecycleEvent[]> {
    const { data, error } = await this.db
      .from('lifecycle_events')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get lifecycle history: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToLifecycleEvent);
  }

  /**
   * Get artifacts by lifecycle stage
   */
  async getArtifactsByStage(stage: ArtifactStatus): Promise<Artifact[]> {
    return artifactRegistry.listArtifacts({ status: stage });
  }

  /**
   * Schedule lifecycle maintenance tasks
   */
  async scheduleMaintenance(): Promise<void> {
    // Apply retention policies
    const retentionReport = await retentionManager.applyRetentionPolicies();
    
    const maintenanceEvent: LifecycleEvent = {
      id: createLifecycleEventId(),
      artifactId: '' as ArtifactId, // System-wide event
      type: 'maintenance_completed',
      timestamp: new Date(),
      data: {
        retentionReport,
      },
      tenantId: 'system',
    };

    await this.recordEvent(maintenanceEvent);
    await this.executeHooks(maintenanceEvent);
  }

  /**
   * Get lifecycle statistics
   */
  async getLifecycleStatistics(): Promise<{
    totalArtifacts: number;
    artifactsByStage: Record<ArtifactStatus, number>;
    recentEvents: LifecycleEvent[];
    promotionRate: number;
    retentionSavings: number;
  }> {
    const stats = await artifactRegistry.getStatistics();
    const artifactsByStage = stats.byStatus;
    
    // Get recent events
    const { data: recentEvents } = await this.db
      .from('lifecycle_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate promotion rate (artifacts promoted to production vs total)
    const promotionRate = stats.total > 0 
      ? (artifactsByStage.production || 0) / stats.total 
      : 0;

    // Get retention statistics
    const retentionStats = await retentionManager.getRetentionStatistics();

    return {
      totalArtifacts: stats.total,
      artifactsByStage,
      recentEvents: (recentEvents || []).map(this.mapDbRecordToLifecycleEvent),
      promotionRate,
      retentionSavings: retentionStats.estimatedStorageSavings,
    };
  }

  /**
   * Archive artifact (end of lifecycle)
   */
  async archiveArtifact(artifactId: ArtifactId, reason: string): Promise<void> {
    const artifact = await artifactRegistry.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    await artifactRegistry.updateArtifactStatus(artifactId, 'archived');

    const archiveEvent: LifecycleEvent = {
      id: createLifecycleEventId(),
      artifactId,
      type: 'archived',
      timestamp: new Date(),
      data: {
        reason,
        previousStatus: artifact.status,
      },
      tenantId: artifact.metadata.tenantId || 'default',
    };

    await this.recordEvent(archiveEvent);
    await this.executeHooks(archiveEvent);
  }

  /**
   * Decommission artifact (permanent removal)
   */
  async decommissionArtifact(artifactId: ArtifactId, reason: string): Promise<void> {
    const artifact = await artifactRegistry.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    // Archive first
    await this.archiveArtifact(artifactId, `Decommissioned: ${reason}`);

    // Then delete (after a grace period in real implementation)
    await artifactRegistry.deleteArtifact(artifactId);

    const decommissionEvent: LifecycleEvent = {
      id: createLifecycleEventId(),
      artifactId,
      type: 'decommissioned',
      timestamp: new Date(),
      data: {
        reason,
        finalStatus: 'decommissioned',
      },
      tenantId: artifact.metadata.tenantId || 'default',
    };

    await this.recordEvent(decommissionEvent);
    await this.executeHooks(decommissionEvent);
  }

  /**
   * Map database record to LifecycleEvent interface
   */
  private mapDbRecordToLifecycleEvent(record: any): LifecycleEvent {
    return {
      id: record.id,
      artifactId: record.artifact_id,
      type: record.type,
      timestamp: new Date(record.created_at),
      data: record.data,
      tenantId: record.tenant_id,
    };
  }
}

// Singleton instance
export const artifactLifecycle = new ArtifactLifecycleManager();

// Built-in hooks for common lifecycle operations

// Notification hook
export const notificationHook: LifecycleHook = {
  id: 'notification',
  description: 'Send notifications for lifecycle events',
  handler: async (event: LifecycleEvent) => {
    // In real implementation, this would send Slack/email notifications
    console.log(`📢 Lifecycle Event: ${event.type} for artifact ${event.artifactId}`);
  },
};

// Metrics hook
export const metricsHook: LifecycleHook = {
  id: 'metrics',
  description: 'Record metrics for lifecycle events',
  handler: async (event: LifecycleEvent) => {
    // In real implementation, this would record metrics to monitoring system
    console.log(`📊 Metrics: ${event.type} event recorded`);
  },
};

// Security hook
export const securityHook: LifecycleHook = {
  id: 'security',
  description: 'Security validation for lifecycle events',
  handler: async (event: LifecycleEvent) => {
    // In real implementation, this would perform security checks
    if (event.type === 'promoted' && event.data.toEnvironment === 'production') {
      console.log(`🔒 Security check: Production promotion for ${event.artifactId}`);
    }
  },
};

// Register built-in hooks
artifactLifecycle.registerHook('registered', notificationHook);
artifactLifecycle.registerHook('promoted', notificationHook);
artifactLifecycle.registerHook('archived', notificationHook);
artifactLifecycle.registerHook('decommissioned', notificationHook);

artifactLifecycle.registerHook('registered', metricsHook);
artifactLifecycle.registerHook('promoted', metricsHook);
artifactLifecycle.registerHook('archived', metricsHook);
artifactLifecycle.registerHook('decommissioned', metricsHook);

artifactLifecycle.registerHook('promoted', securityHook);
