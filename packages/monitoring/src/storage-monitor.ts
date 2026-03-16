/**
 * Storage Usage Monitoring
 * 
 * Monitors Supabase storage usage across all buckets with tenant isolation.
 * Provides real-time storage metrics and optimization recommendations.
 */

import type { StorageUsage, CostMetrics, TenantId } from './types'

/**
 * Storage monitoring configuration
 */
interface StorageMonitorConfig {
  /** Collection interval in hours */
  collectionInterval: number
  /** Large file threshold in bytes (default: 5MB) */
  largeFileThreshold: number
  /** Whether to enable detailed file tracking */
  enableDetailedTracking: boolean
}

/**
 * Storage usage monitor class
 */
export class StorageMonitor {
  private config: StorageMonitorConfig

  constructor(config: Partial<StorageMonitorConfig> = {}) {
    this.config = {
      collectionInterval: 1, // 1 hour default
      largeFileThreshold: 5 * 1024 * 1024, // 5MB
      enableDetailedTracking: true,
      ...config,
    }
  }

  /**
   * Collects current storage usage for all buckets
   * Mock implementation for now - will be integrated with actual Supabase storage API
   */
  async collectStorageUsage(): Promise<StorageUsage[]> {
    try {
      // Mock implementation - in production, this would query Supabase storage API
      const mockUsage: StorageUsage[] = [
        {
          bucket: 'tenant-123-assets',
          totalSize: 1024 * 1024 * 100, // 100MB
          fileCount: 250,
          averageFileSize: 1024 * 1024 * 0.4, // 400KB average
          largestFileSize: 1024 * 1024 * 5, // 5MB largest
          timestamp: new Date().toISOString(),
        },
        {
          bucket: 'tenant-123-documents',
          totalSize: 1024 * 1024 * 50, // 50MB
          fileCount: 100,
          averageFileSize: 1024 * 1024 * 0.5, // 500KB average
          largestFileSize: 1024 * 1024 * 2, // 2MB largest
          timestamp: new Date().toISOString(),
        },
      ]

      console.log('Storage usage collected', {
        bucketCount: mockUsage.length,
        totalFiles: mockUsage.reduce((sum, usage) => sum + usage.fileCount, 0),
        totalSize: mockUsage.reduce((sum, usage) => sum + usage.totalSize, 0),
      })

      return mockUsage
    } catch (error) {
      console.error('Error in collectStorageUsage:', error)
      throw error
    }
  }

  /**
   * Gets storage usage for a specific tenant
   */
  async getTenantStorageUsage(tenantId: TenantId): Promise<StorageUsage[]> {
    try {
      // Mock implementation for tenant-specific storage
      const mockUsage: StorageUsage[] = [
        {
          bucket: `tenant-${tenantId}-assets`,
          totalSize: 1024 * 1024 * 75, // 75MB
          fileCount: 180,
          averageFileSize: 1024 * 1024 * 0.42, // 420KB average
          largestFileSize: 1024 * 1024 * 4, // 4MB largest
          timestamp: new Date().toISOString(),
        },
        {
          bucket: `tenant-${tenantId}-documents`,
          totalSize: 1024 * 1024 * 30, // 30MB
          fileCount: 75,
          averageFileSize: 1024 * 1024 * 0.4, // 400KB average
          largestFileSize: 1024 * 1024 * 1.5, // 1.5MB largest
          timestamp: new Date().toISOString(),
        },
      ]

      return mockUsage
    } catch (error) {
      console.error('Error in getTenantStorageUsage:', error)
      throw error
    }
  }

  /**
   * Identifies large files that could be optimized
   */
  async identifyLargeFiles(threshold?: number): Promise<Array<{
    name: string
    bucket: string
    size: number
    sizeFormatted: string
    createdAt: string
  }>> {
    try {
      const sizeThreshold = threshold || this.config.largeFileThreshold
      
      // Mock implementation - in production, this would query actual storage
      const mockLargeFiles = [
        {
          name: 'large-image.png',
          bucket: 'tenant-123-assets',
          size: 6 * 1024 * 1024, // 6MB
          sizeFormatted: this.formatBytes(6 * 1024 * 1024),
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'backup-dump.zip',
          bucket: 'tenant-123-documents',
          size: 8 * 1024 * 1024, // 8MB
          sizeFormatted: this.formatBytes(8 * 1024 * 1024),
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ].filter(file => file.size >= sizeThreshold)

      console.log('Large files identified', {
        count: mockLargeFiles.length,
        threshold: sizeThreshold,
        totalSize: mockLargeFiles.reduce((sum, file) => sum + file.size, 0),
      })

      return mockLargeFiles
    } catch (error) {
      console.error('Error in identifyLargeFiles:', error)
      throw error
    }
  }

  /**
   * Generates storage optimization recommendations
   */
  async generateOptimizationRecommendations(tenantId?: TenantId): Promise<Array<{
    type: 'large_files' | 'unused_files' | 'compression' | 'cleanup'
    title: string
    description: string
    estimatedSavings: number
    difficulty: 'easy' | 'medium' | 'hard'
    priority: 'low' | 'medium' | 'high'
  }>> {
    const recommendations = []
    
    try {
      // Check for large files
      const largeFiles = await this.identifyLargeFiles()
      if (largeFiles.length > 0) {
        recommendations.push({
          type: 'large_files' as const,
          title: 'Optimize Large Files',
          description: `Found ${largeFiles.length} files larger than ${this.formatBytes(this.config.largeFileThreshold)}. Consider compressing or archiving these files.`,
          estimatedSavings: this.calculateStorageSavings(largeFiles),
          difficulty: 'medium' as const,
          priority: 'high' as const,
        })
      }

      // Check for old files (mock implementation)
      const oldFilesCount = 25 // Mock count
      if (oldFilesCount > 0) {
        recommendations.push({
          type: 'cleanup' as const,
          title: 'Clean Up Old Files',
          description: `Found ${oldFilesCount} files older than 90 days. Consider archiving or deleting unused files.`,
          estimatedSavings: 15.50, // Mock savings estimate
          difficulty: 'easy' as const,
          priority: 'medium' as const,
        })
      }

      console.log('Storage recommendations generated', {
        count: recommendations.length,
        tenantId,
      })

      return recommendations
    } catch (error) {
      console.error('Error generating optimization recommendations:', error)
      throw error
    }
  }

  /**
   * Calculates potential storage savings from file operations
   */
  private calculateStorageSavings(files: Array<{ size: number }>): number {
    // Estimate 30% savings from compression and optimization
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const totalSizeGB = totalSize / (1024 * 1024 * 1024)
    return totalSizeGB * 0.021 * 0.3 // 30% of $0.021 per GB
  }

  /**
   * Formats bytes in human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Converts storage usage to cost metrics
   */
  async convertToCostMetrics(
    storageUsage: StorageUsage[],
    tenantId: TenantId,
    costPerGB: number = 0.021 // $0.021 per GB per month
  ): Promise<CostMetrics> {
    const totalStorageBytes = storageUsage.reduce((sum, usage) => sum + usage.totalSize, 0)
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024)
    
    // Calculate monthly cost (pro-rated for current period)
    const monthlyCost = totalStorageGB * costPerGB
    
    return {
      id: `storage-${Date.now()}`,
      tenantId,
      storageUsage: totalStorageBytes,
      cicdRuntime: 0, // No CI/CD cost in storage metrics
      bandwidthUsage: 0, // No bandwidth cost in storage metrics
      totalCost: monthlyCost,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      period: 'daily',
      metadata: {
        bucketCount: storageUsage.length,
        totalFiles: storageUsage.reduce((sum, usage) => sum + usage.fileCount, 0),
        averageFileSize: storageUsage.reduce((sum, usage) => sum + usage.averageFileSize, 0) / storageUsage.length,
        costPerGB,
      },
    }
  }
}
