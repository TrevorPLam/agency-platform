import { captureAnalyticsEvent, AnalyticsEvent } from './client'

export interface FileUploadEvent extends AnalyticsEvent {
  event: 'file_uploaded'
  properties: {
    tenantId: string
    fileId: string
    filename: string
    size: number
    contentType: string
    scanStatus: 'pending' | 'clean' | 'infected' | 'error'
    uploadTime: number
    validationWarnings?: string[]
  }
}

export interface FileDownloadEvent extends AnalyticsEvent {
  event: 'file_downloaded'
  properties: {
    tenantId: string
    fileId: string
    filename: string
    downloadTime: number
    userAgent?: string
    ipAddress?: string
  }
}

export interface FileDeleteEvent extends AnalyticsEvent {
  event: 'file_deleted'
  properties: {
    tenantId: string
    fileId: string
    filename: string
    deletedBy: string
    deleteReason: string
  }
}

export interface FileQuarantineEvent extends AnalyticsEvent {
  event: 'file_quarantined'
  properties: {
    tenantId: string
    fileId: string
    filename: string
    quarantineReason: string
    threats: string[]
    scanProvider: string
    scanId: string
  }
}

export interface FileSecurityEvent extends AnalyticsEvent {
  event: 'security_file_validation_failed' | 'security_virus_detected' | 'security_upload_error'
  properties: {
    tenantId: string
    filename: string
    error?: string
    errors?: string[]
    threats?: string[]
    scanId?: string
    isBlocked?: boolean
    userAgent?: string
    ipAddress?: string
  }
}

export interface FileStorageMetricsEvent extends AnalyticsEvent {
  event: 'storage_metrics'
  properties: {
    tenantId: string
    totalFiles: number
    totalSize: number
    quarantinedFiles: number
    infectedFiles: number
    pendingScans: number
    uploadsToday: number
    uniqueContentTypes: number
    averageFileSize: number
    largestFileSize: number
    storageUtilization: number
  }
}

/**
 * Capture file upload analytics event
 */
export async function captureFileUploadEvent(properties: {
  tenantId: string
  fileId: string
  filename: string
  size: number
  contentType: string
  scanStatus: 'pending' | 'clean' | 'infected' | 'error'
  uploadTime: number
  validationWarnings?: string[]
}): Promise<void> {
  const event: FileUploadEvent = {
    event: 'file_uploaded',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Capture file download analytics event
 */
export async function captureFileDownloadEvent(properties: {
  tenantId: string
  fileId: string
  filename: string
  downloadTime: number
  userAgent?: string
  ipAddress?: string
}): Promise<void> {
  const event: FileDownloadEvent = {
    event: 'file_downloaded',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Capture file delete analytics event
 */
export async function captureFileDeleteEvent(properties: {
  tenantId: string
  fileId: string
  filename: string
  deletedBy: string
  deleteReason: string
}): Promise<void> {
  const event: FileDeleteEvent = {
    event: 'file_deleted',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Capture file quarantine analytics event
 */
export async function captureFileQuarantineEvent(properties: {
  tenantId: string
  fileId: string
  filename: string
  quarantineReason: string
  threats: string[]
  scanProvider: string
  scanId: string
}): Promise<void> {
  const event: FileQuarantineEvent = {
    event: 'file_quarantined',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Capture file security analytics events
 */
export async function captureFileSecurityEvent(
  eventType: 'security_file_validation_failed' | 'security_virus_detected' | 'security_upload_error',
  properties: {
    tenantId: string
    filename: string
    error?: string
    errors?: string[]
    threats?: string[]
    scanId?: string
    isBlocked?: boolean
    userAgent?: string
    ipAddress?: string
  }
): Promise<void> {
  const event: FileSecurityEvent = {
    event: eventType,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Capture storage metrics analytics event
 */
export async function captureStorageMetricsEvent(properties: {
  tenantId: string
  totalFiles: number
  totalSize: number
  quarantinedFiles: number
  infectedFiles: number
  pendingScans: number
  uploadsToday: number
  uniqueContentTypes: number
  averageFileSize: number
  largestFileSize: number
  storageUtilization: number
}): Promise<void> {
  const event: FileStorageMetricsEvent = {
    event: 'storage_metrics',
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  }

  await captureAnalyticsEvent(event.event, event.properties)
}

/**
 * Batch capture multiple file events
 */
export async function captureFileEventsBatch(events: Array<{
  type: 'upload' | 'download' | 'delete' | 'quarantine' | 'security' | 'metrics'
  properties: Record<string, unknown>
}>): Promise<void> {
  const promises = events.map(async ({ type, properties }) => {
    switch (type) {
      case 'upload':
        return captureFileUploadEvent(properties as Parameters<typeof captureFileUploadEvent>[0])
      case 'download':
        return captureFileDownloadEvent(properties as Parameters<typeof captureFileDownloadEvent>[0])
      case 'delete':
        return captureFileDeleteEvent(properties as Parameters<typeof captureFileDeleteEvent>[0])
      case 'quarantine':
        return captureFileQuarantineEvent(properties as Parameters<typeof captureFileQuarantineEvent>[0])
      case 'security':
        return captureFileSecurityEvent(
          properties.eventType as any,
          properties as Parameters<typeof captureFileSecurityEvent>[1]
        )
      case 'metrics':
        return captureStorageMetricsEvent(properties as Parameters<typeof captureStorageMetricsEvent>[0])
      default:
        console.warn('Unknown file event type:', type)
        return Promise.resolve()
    }
  })

  await Promise.allSettled(promises)
}

/**
 * Generate storage analytics report
 */
export interface StorageAnalyticsReport {
  period: {
    start: string
    end: string
  }
  summary: {
    totalUploads: number
    totalDownloads: number
    totalDeletes: number
    totalSecurityEvents: number
    totalQuarantines: number
  }
  fileTypes: Array<{
    contentType: string
    count: number
    totalSize: number
    averageSize: number
  }>
  security: {
    validationFailures: number
    virusDetections: number
    uploadErrors: number
    quarantineRate: number
  }
  trends: Array<{
    date: string
    uploads: number
    downloads: number
    securityEvents: number
  }>
}

/**
 * Helper functions for common file analytics patterns
 */
export const FileAnalyticsHelpers = {
  /**
   * Calculate file size distribution
   */
  calculateSizeDistribution(sizes: number[]): Array<{
    range: string
    count: number
    percentage: number
  }> {
    const ranges = [
      { min: 0, max: 1024 * 1024, label: '< 1MB' }, // < 1MB
      { min: 1024 * 1024, max: 10 * 1024 * 1024, label: '1-10MB' }, // 1-10MB
      { min: 10 * 1024 * 1024, max: 50 * 1024 * 1024, label: '10-50MB' }, // 10-50MB
      { min: 50 * 1024 * 1024, max: Infinity, label: '> 50MB' }, // > 50MB
    ]

    const total = sizes.length
    return ranges.map(range => ({
      range: range.label,
      count: sizes.filter(size => size >= range.min && size < range.max).length,
      percentage: total > 0 ? (sizes.filter(size => size >= range.min && size < range.max).length / total) * 100 : 0,
    }))
  },

  /**
   * Calculate upload success rate
   */
  calculateUploadSuccessRate(total: number, successful: number): number {
    return total > 0 ? (successful / total) * 100 : 0
  },

  /**
   * Calculate security threat breakdown
   */
  calculateThreatBreakdown(threats: string[]): Array<{
    threat: string
    count: number
    percentage: number
  }> {
    const threatCounts = threats.reduce((acc, threat) => {
      acc[threat] = (acc[threat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = threats.length
    return Object.entries(threatCounts).map(([threat, count]) => ({
      threat,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
  },

  /**
   * Generate storage efficiency metrics
   */
  calculateStorageEfficiency(totalSize: number, fileCount: number): {
    averageFileSize: number
    compressionRatio: number
    utilizationScore: number
  } {
    const averageFileSize = fileCount > 0 ? totalSize / fileCount : 0
    
    // Mock compression ratio (would be calculated from actual compressed vs uncompressed sizes)
    const compressionRatio = 0.85
    
    // Utilization score based on file count and size efficiency
    const utilizationScore = Math.min(100, (fileCount / 1000) * 50 + (1 - compressionRatio) * 50)

    return {
      averageFileSize,
      compressionRatio,
      utilizationScore,
    }
  },
}
