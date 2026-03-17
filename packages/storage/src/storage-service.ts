import { Buffer } from 'node:buffer'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { FileValidator, FileValidationInput, FileValidationResult, FileMetadata } from './file-validator'
import { VirusScanningService, VirusScanConfig, ScanResult } from './virus-scanner'
import { captureAnalyticsEvent } from '@agency/analytics/server'

export const StorageConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseServiceKey: z.string().min(1),
  bucketName: z.string().default('uploads'),
  virusScanning: VirusScanConfig,
  maxFileSize: z.number().default(50 * 1024 * 1024), // 50MB
  enableQuarantine: z.boolean().default(true),
  retentionDays: z.number().default(365),
})

export type StorageConfig = z.infer<typeof StorageConfigSchema>

export interface UploadRequest {
  file: Buffer
  filename: string
  contentType: string
  tenantId: string
  uploadedBy: string
  metadata?: Record<string, unknown>
}

export interface UploadResult {
  success: boolean
  fileId?: string
  url?: string
  metadata?: FileMetadata
  validation?: FileValidationResult
  scanResult?: ScanResult
  errors: string[]
  warnings: string[]
}

export interface FileRecord {
  id: string
  original_name: string
  safe_name: string
  content_type: string
  size: number
  checksum: string
  tenant_id: string
  uploaded_by: string
  uploaded_at: string
  is_quarantined: boolean
  scan_status: 'pending' | 'clean' | 'infected' | 'error'
  scan_result?: Record<string, unknown>
  storage_path: string
  public_url?: string
  metadata: Record<string, unknown>
  retention_until: string
}

export class StorageService {
  private supabase: SupabaseClient
  private fileValidator: FileValidator
  private virusScanner: VirusScanningService
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    this.fileValidator = FileValidator.getInstance()
    this.virusScanner = new VirusScanningService(config.virusScanning)
  }

  /**
   * Upload file with comprehensive security validation
   */
  async uploadFile(request: UploadRequest): Promise<UploadResult> {
    const result: UploadResult = {
      success: false,
      errors: [],
      warnings: [],
    }

    try {
      // 1. Validate input
      const checksum = await this.fileValidator.calculateChecksum(request.file)
      const validationInput: FileValidationInput = {
        filename: request.filename,
        contentType: request.contentType,
        size: request.file.length,
        buffer: request.file,
        tenantId: request.tenantId,
      }

      // 2. Security validation
      const validation = await this.fileValidator.validateFile(validationInput)
      result.validation = validation

      if (!validation.isValid || validation.isBlocked) {
        result.errors.push(...validation.errors)
        await this.logSecurityEvent('file_validation_failed', {
          tenantId: request.tenantId,
          filename: request.filename,
          errors: validation.errors,
          isBlocked: validation.isBlocked,
        })
        return result
      }

      // Add warnings
      result.warnings.push(...validation.warnings)

      // 3. Check for duplicates
      const existingFile = await this.findDuplicate(checksum, request.tenantId)
      if (existingFile) {
        result.success = true
        result.fileId = existingFile.id
        result.url = existingFile.public_url
        result.metadata = this.mapToMetadata(existingFile)
        result.warnings.push('Duplicate file detected - returning existing file')
        return result
      }

      // 4. Virus scanning
      let scanResult: ScanResult | null = null
      if (this.config.virusScanning.enabled) {
        try {
          scanResult = await this.virusScanner.scanFile({
            fileBuffer: request.file,
            filename: request.filename,
            fileSize: request.file.length,
            checksum,
            tenantId: request.tenantId,
          })
          result.scanResult = scanResult

          if (!scanResult.isClean) {
            if (this.config.enableQuarantine) {
              result.warnings.push('File quarantined due to virus detection')
              // Still upload but mark as quarantined
            } else {
              result.errors.push('File rejected due to virus detection')
              await this.logSecurityEvent('virus_detected', {
                tenantId: request.tenantId,
                filename: request.filename,
                threats: scanResult.threats,
                scanId: scanResult.scanId,
              })
              return result
            }
          }
        } catch (scanError) {
          result.warnings.push(`Virus scanning failed: ${scanError instanceof Error ? scanError.message : 'Unknown error'}`)
        }
      }

      // 5. Generate safe filename and storage path
      const safeName = this.fileValidator.generateSafeFilename(request.filename, request.tenantId)
      const storagePath = `${request.tenantId}/${safeName}`

      // 6. Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(request.file, storagePath, request.contentType)
      if (!uploadResult.success) {
        result.errors.push(...uploadResult.errors)
        return result
      }

      // 7. Create database record
      const fileRecord = await this.createFileRecord({
        originalName: request.filename,
        safeName,
        contentType: request.contentType,
        size: request.file.length,
        checksum,
        tenantId: request.tenantId,
        uploadedBy: request.uploadedBy,
        storagePath,
        isQuarantined: scanResult ? !scanResult.isClean : false,
        scanStatus: scanResult ? (scanResult.isClean ? 'clean' : 'infected') : 'pending',
        scanResult: scanResult ? this.serializeScanResult(scanResult) : undefined,
        publicUrl: uploadResult.publicUrl,
        metadata: request.metadata || {},
      })

      // 8. Return success result
      result.success = true
      result.fileId = fileRecord.id
      result.url = fileRecord.public_url
      result.metadata = this.mapToMetadata(fileRecord)

      // 9. Log analytics
      await this.logAnalyticsEvent('file_uploaded', {
        tenantId: request.tenantId,
        fileId: fileRecord.id,
        filename: request.filename,
        size: request.file.length,
        contentType: request.contentType,
        scanStatus: fileRecord.scan_status,
      })

      return result

    } catch (error) {
      result.errors.push(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      await this.logSecurityEvent('upload_error', {
        tenantId: request.tenantId,
        filename: request.filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      
      return result
    }
  }

  /**
   * Get file information
   */
  async getFile(fileId: string, tenantId: string): Promise<FileRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching file:', error)
      return null
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get file record
      const fileRecord = await this.getFile(fileId, tenantId)
      if (!fileRecord) {
        return { success: false, error: 'File not found' }
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(this.config.bucketName)
        .remove([fileRecord.storage_path])

      if (storageError) {
        return { success: false, error: `Storage deletion failed: ${storageError.message}` }
      }

      // Delete database record
      const { error: dbError } = await this.supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('tenant_id', tenantId)

      if (dbError) {
        return { success: false, error: `Database deletion failed: ${dbError.message}` }
      }

      await this.logAnalyticsEvent('file_deleted', {
        tenantId,
        fileId,
        filename: fileRecord.original_name,
      })

      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * List files for tenant
   */
  async listFiles(
    tenantId: string, 
    options: {
      limit?: number
      offset?: number
      search?: string
      contentType?: string
    } = {}
  ): Promise<{ files: FileRecord[]; total: number }> {
    try {
      let query = this.supabase
        .from('files')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('uploaded_at', { ascending: false })

      if (options.search) {
        query = query.ilike('original_name', `%${options.search}%`)
      }

      if (options.contentType) {
        query = query.eq('content_type', options.contentType)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error listing files:', error)
        return { files: [], total: 0 }
      }

      return { 
        files: data || [], 
        total: count || 0 
      }

    } catch (error) {
      console.error('Error listing files:', error)
      return { files: [], total: 0 }
    }
  }

  /**
   * Get download URL
   */
  async getDownloadUrl(fileId: string, tenantId: string): Promise<string | null> {
    try {
      const fileRecord = await this.getFile(fileId, tenantId)
      if (!fileRecord) {
        return null
      }

      if (fileRecord.is_quarantined) {
        return null
      }

      const { data } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(fileRecord.storage_path)

      return data.publicUrl

    } catch (error) {
      console.error('Error getting download URL:', error)
      return null
    }
  }

  /**
   * Update file retention
   */
  async updateRetention(
    fileId: string, 
    tenantId: string, 
    retentionDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const retentionUntil = new Date()
      retentionUntil.setDate(retentionUntil.getDate() + retentionDays)

      const { error } = await this.supabase
        .from('files')
        .update({ retention_until: retentionUntil.toISOString() })
        .eq('id', fileId)
        .eq('tenant_id', tenantId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private async uploadToStorage(
    file: Buffer, 
    path: string, 
    contentType: string
  ): Promise<{ success: boolean; publicUrl?: string; errors: string[] }> {
    const errors: string[] = []

    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucketName)
        .upload(path, file, {
          contentType,
          upsert: false,
        })

      if (error) {
        errors.push(`Storage upload failed: ${error.message}`)
        return { success: false, errors }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.config.bucketName)
        .getPublicUrl(path)

      return { 
        success: true, 
        publicUrl: urlData.publicUrl 
      }

    } catch (error) {
      errors.push(`Storage upload error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, errors }
    }
  }

  private async createFileRecord(record: {
    originalName: string
    safeName: string
    contentType: string
    size: number
    checksum: string
    tenantId: string
    uploadedBy: string
    storagePath: string
    isQuarantined: boolean
    scanStatus: 'pending' | 'clean' | 'infected' | 'error'
    scanResult?: Record<string, unknown>
    publicUrl?: string
    metadata: Record<string, unknown>
  }): Promise<FileRecord> {
    const retentionUntil = new Date()
    retentionUntil.setDate(retentionUntil.getDate() + this.config.retentionDays)

    const { data, error } = await this.supabase
      .from('files')
      .insert({
        id: crypto.randomUUID(),
        original_name: record.originalName,
        safe_name: record.safeName,
        content_type: record.contentType,
        size: record.size,
        checksum: record.checksum,
        tenant_id: record.tenantId,
        uploaded_by: record.uploadedBy,
        uploaded_at: new Date().toISOString(),
        is_quarantined: record.isQuarantined,
        scan_status: record.scanStatus,
        scan_result: record.scanResult,
        storage_path: record.storagePath,
        public_url: record.publicUrl,
        metadata: record.metadata,
        retention_until: retentionUntil.toISOString(),
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to create file record: ${error?.message || 'Unknown error'}`)
    }

    return data
  }

  private async findDuplicate(checksum: string, tenantId: string): Promise<FileRecord | null> {
    try {
      const { data } = await this.supabase
        .from('files')
        .select('*')
        .eq('checksum', checksum)
        .eq('tenant_id', tenantId)
        .eq('is_quarantined', false)
        .single()

      return data

    } catch (error) {
      return null
    }
  }

  private mapToMetadata(record: FileRecord): FileMetadata {
    return {
      originalName: record.original_name,
      safeName: record.safe_name,
      mimeType: record.content_type,
      size: record.size,
      detectedType: record.content_type, // Would be populated by validation
      confidence: 1.0,
      uploadedAt: new Date(record.uploaded_at),
      tenantId: record.tenant_id,
      uploadedBy: record.uploaded_by,
      checksum: record.checksum,
    }
  }

  private serializeScanResult(result: ScanResult): Record<string, unknown> {
    return {
      isClean: result.isClean,
      scanId: result.scanId,
      threats: result.threats,
      scanTime: result.scanTime.toISOString(),
      provider: result.provider,
      confidence: result.confidence,
      details: result.details,
    }
  }

  private async logAnalyticsEvent(event: string, properties: Record<string, unknown>): Promise<void> {
    try {
      await captureAnalyticsEvent(event, properties)
    } catch (error) {
      console.error('Failed to log analytics event:', error)
    }
  }

  private async logSecurityEvent(
    event: string, 
    properties: Record<string, unknown>
  ): Promise<void> {
    try {
      await captureAnalyticsEvent(`security_${event}`, {
        ...properties,
        timestamp: new Date().toISOString(),
        service: 'storage',
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}
