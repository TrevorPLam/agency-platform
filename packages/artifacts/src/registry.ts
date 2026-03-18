import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from '@agency/database/admin';
import {
  Artifact,
  ArtifactId,
  ArtifactType,
  ArtifactStatus,
  Environment,
  ArtifactMetadata,
  RetentionPolicy,
  PolicyId,
  createArtifactId,
  ArtifactSchema
} from './types';

export class ArtifactRegistry {
  private db = getAdminClient();

  /**
   * Register a new artifact in the registry
   */
  async registerArtifact(
    name: string,
    version: string,
    type: ArtifactType,
    environment: Environment,
    content: Buffer | string,
    metadata: Omit<ArtifactMetadata, 'vulnerabilities' | 'sbom'>
  ): Promise<Artifact> {
    // Calculate integrity hash
    const integrity = this.calculateIntegrity(content);

    // Create artifact record
    const artifactData = {
      id: this.generateArtifactId(name, version, environment),
      name,
      version,
      type,
      status: 'created' as ArtifactStatus,
      environment,
      integrity,
      size: Buffer.byteLength(content),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        vulnerabilities: [], // Will be populated by security scans
      },
      promotion_path: [],
      retention_policy: await this.getDefaultRetentionPolicy(type, environment),
    };

    // Validate with Zod schema
    const validatedArtifact = ArtifactSchema.parse(artifactData);

    // Store in database
    const { data, error } = await this.db
      .from('artifacts')
      .insert([validatedArtifact])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register artifact: ${error.message}`);
    }

    // Store content in Supabase Storage
    await this.storeArtifactContent(data.id, content);

    return this.mapDbRecordToArtifact(data);
  }

  /**
   * Get an artifact by ID
   */
  async getArtifact(id: ArtifactId): Promise<Artifact | null> {
    const { data, error } = await this.db
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDbRecordToArtifact(data);
  }

  /**
   * List artifacts with filtering
   */
  async listArtifacts(filters: {
    type?: ArtifactType;
    environment?: Environment;
    status?: ArtifactStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<Artifact[]> {
    let query = this.db.from('artifacts').select('*');

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.environment) {
      query = query.eq('environment', filters.environment);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
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
      throw new Error(`Failed to list artifacts: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToArtifact);
  }

  /**
   * Update artifact status
   */
  async updateArtifactStatus(id: ArtifactId, status: ArtifactStatus): Promise<Artifact> {
    const { data, error } = await this.db
      .from('artifacts')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update artifact status: ${error?.message || 'Not found'}`);
    }

    return this.mapDbRecordToArtifact(data);
  }

  /**
   * Update artifact metadata
   */
  async updateArtifactMetadata(
    id: ArtifactId,
    metadata: Partial<ArtifactMetadata>
  ): Promise<Artifact> {
    const { data, error } = await this.db
      .from('artifacts')
      .update({
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update artifact metadata: ${error?.message || 'Not found'}`);
    }

    return this.mapDbRecordToArtifact(data);
  }

  /**
   * Delete an artifact
   */
  async deleteArtifact(id: ArtifactId): Promise<void> {
    // Delete content first
    await this.deleteArtifactContent(id);

    // Delete database record
    const { error } = await this.db
      .from('artifacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete artifact: ${error.message}`);
    }
  }

  /**
   * Search artifacts by name or metadata
   */
  async searchArtifacts(query: string, limit: number = 50): Promise<Artifact[]> {
    const { data, error } = await this.db
      .from('artifacts')
      .select('*')
      .or(`name.ilike.%${query}%,metadata->>description.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search artifacts: ${error.message}`);
    }

    return (data || []).map(this.mapDbRecordToArtifact);
  }

  /**
   * Get artifact statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<ArtifactType, number>;
    byEnvironment: Record<Environment, number>;
    byStatus: Record<ArtifactStatus, number>;
    totalSize: number;
  }> {
    // Get total count and size
    const { data: totalData, error: totalError } = await this.db
      .from('artifacts')
      .select('count(*), sum(size)');

    if (totalError) {
      throw new Error(`Failed to get total statistics: ${totalError.message}`);
    }

    // Get counts by type
    const { data: typeData, error: typeError } = await this.db
      .from('artifacts')
      .select('type, count(*)')
      .group('type');

    if (typeError) {
      throw new Error(`Failed to get type statistics: ${typeError.message}`);
    }

    // Get counts by environment
    const { data: envData, error: envError } = await this.db
      .from('artifacts')
      .select('environment, count(*)')
      .group('environment');

    if (envError) {
      throw new Error(`Failed to get environment statistics: ${envError.message}`);
    }

    // Get counts by status
    const { data: statusData, error: statusError } = await this.db
      .from('artifacts')
      .select('status, count(*)')
      .group('status');

    if (statusError) {
      throw new Error(`Failed to get status statistics: ${statusError.message}`);
    }

    const total = Number(totalData?.[0]?.count || 0);
    const totalSize = Number(totalData?.[0]?.sum || 0);

    return {
      total,
      byType: this.groupCounts(typeData || [], 'type') as Record<ArtifactType, number>,
      byEnvironment: this.groupCounts(envData || [], 'environment') as Record<Environment, number>,
      byStatus: this.groupCounts(statusData || [], 'status') as Record<ArtifactStatus, number>,
      totalSize,
    };
  }

  /**
   * Generate a unique artifact ID
   */
  private generateArtifactId(name: string, version: string, environment: Environment): ArtifactId {
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(`${name}-${version}-${environment}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    return createArtifactId(`${name}-${version}-${environment}-${hash}`);
  }

  /**
   * Calculate SHA-256 integrity hash
   */
  private calculateIntegrity(content: Buffer | string): string {
    const hash = createHash('sha256');
    hash.update(content);
    return `sha256:${hash.digest('hex')}`;
  }

  /**
   * Store artifact content in Supabase Storage
   */
  private async storeArtifactContent(id: ArtifactId, content: Buffer | string): Promise<void> {
    try {
      // Convert content to Buffer if it's a string
      const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      // Get environment variables
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
      const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Missing Supabase configuration for artifact storage - using fallback');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Store in artifacts bucket with content-addressable path
      const storagePath = `artifacts/${id}`;
      const { error } = await supabase.storage
        .from('artifacts')
        .upload(storagePath, contentBuffer, {
          contentType: 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to store artifact content: ${error.message}`);
      }

      console.log(`✅ Stored content for artifact ${id} (${contentBuffer.length} bytes)`);
    } catch (error) {
      console.error(`❌ Failed to store content for artifact ${id}:`, error);
      // Don't throw - storage failure shouldn't break artifact registration
    }
  }

  /**
   * Get artifact content from Supabase Storage
   */
  async getArtifactContent(id: ArtifactId): Promise<Buffer> {
    try {
      // Get environment variables
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
      const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration for artifact storage');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get from artifacts bucket
      const storagePath = `artifacts/${id}`;
      const { data, error } = await supabase.storage
        .from('artifacts')
        .download(storagePath);

      if (error) {
        throw new Error(`Failed to retrieve artifact content: ${error.message}`);
      }

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.error(`❌ Failed to retrieve content for artifact ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete artifact content from Supabase Storage
   */
  private async deleteArtifactContent(id: ArtifactId): Promise<void> {
    try {
      // Get environment variables
      const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
      const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

      if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Missing Supabase configuration for artifact storage - skipping cleanup');
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Delete from artifacts bucket
      const storagePath = `artifacts/${id}`;
      const { error } = await supabase.storage
        .from('artifacts')
        .remove([storagePath]);

      if (error) {
        console.warn(`Failed to delete artifact content: ${error.message}`);
      } else {
        console.log(`✅ Deleted content for artifact ${id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete content for artifact ${id}:`, error);
      // Don't throw - storage cleanup failure shouldn't break artifact deletion
    }
  }

  /**
   * Get default retention policy for artifact type and environment
   */
  private async getDefaultRetentionPolicy(type: ArtifactType, environment: Environment): Promise<RetentionPolicy> {
    const policyId = `default-${type}-${environment}`;

    const policy: RetentionPolicy = {
      id: policyId as PolicyId,
      name: `Default ${type} ${environment} Policy`,
      environment,
      maxAge: environment === 'production' ? 365 : 90, // days
      maxVersions: environment === 'production' ? 10 : 5,
      archiveOlderThan: environment === 'production' ? 180 : 30, // days
      deleteOlderThan: environment === 'production' ? 365 : 90, // days
      exceptions: [], // No exceptions by default
    };

    return policy;
  }

  /**
   * Map database record to Artifact interface
   */
  private mapDbRecordToArtifact(record: any): Artifact {
    return ArtifactSchema.parse({
      ...record,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      metadata: {
        ...record.metadata,
        description: record.metadata?.description || undefined,
      },
    });
  }

  /**
   * Helper to group counts by a field
   */
  private groupCounts(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      acc[item[field]] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);
  }
}

// Singleton instance
export const artifactRegistry = new ArtifactRegistry();
