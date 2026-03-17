import { Buffer } from 'node:buffer'
import { fileTypeFromBuffer } from 'file-type'
import { z } from 'zod'

// File magic numbers for common types
export const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/svg+xml': [0x3C, 0x73, 0x76, 0x67], // <?xml
  
  // Documents
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.ms-excel': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.ms-powerpoint': [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [0x50, 0x4B, 0x03, 0x04],
  
  // Archives (blocked by default)
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00],
  'application/x-7z-compressed': [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
  
  // Text files
  'text/plain': [], // No signature, validated by content
  'text/csv': [], // No signature, validated by content
  
  // Media
  'video/mp4': [0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x56],
  'audio/mpeg': [0x49, 0x44, 0x33],
} as const

// Allowed file types by business requirement
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Text
  'text/plain',
  'text/csv',
] as const

// Blocked file types (high risk)
export const BLOCKED_FILE_TYPES = [
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-shockwave-flash',
] as const

// File size limits per type (in bytes)
export const FILE_SIZE_LIMITS = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 10 * 1024 * 1024,  // 10MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'application/pdf': 50 * 1024 * 1024, // 50MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20 * 1024 * 1024, // 20MB
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 20 * 1024 * 1024, // 20MB
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 50 * 1024 * 1024, // 50MB
  'text/plain': 1 * 1024 * 1024,  // 1MB
  'text/csv': 5 * 1024 * 1024,   // 5MB
} as const

export const FileValidationSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters')
    .refine(name => !name.startsWith('.'), 'Filename cannot start with a dot')
    .refine(name => !name.includes('..'), 'Filename cannot contain directory traversal'),
  
  contentType: z.enum(ALLOWED_FILE_TYPES),
  
  size: z.number()
    .min(1, 'File must be larger than 0 bytes')
    .max(50 * 1024 * 1024, 'File too large (max 50MB)'),
  
  buffer: z.instanceof(Buffer),
  
  tenantId: z.string().uuid('Invalid tenant ID'),
})

export type FileValidationInput = z.infer<typeof FileValidationSchema>

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  detectedType?: string
  confidence?: number
  isBlocked: boolean
  requiresScanning: boolean
}

export interface FileMetadata {
  originalName: string
  safeName: string
  mimeType: string
  size: number
  detectedType: string
  confidence: number
  uploadedAt: Date
  tenantId: string
  uploadedBy: string
  checksum: string
}

export class FileValidator {
  private static instance: FileValidator
  
  public static getInstance(): FileValidator {
    if (!FileValidator.instance) {
      FileValidator.instance = new FileValidator()
    }
    return FileValidator.instance
  }

  /**
   * Validate file using multiple security layers
   */
  async validateFile(input: FileValidationInput): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      isBlocked: false,
      requiresScanning: true,
    }

    try {
      // 1. Schema validation
      const schemaResult = FileValidationSchema.safeParse(input)
      if (!schemaResult.success) {
        result.isValid = false
        result.errors.push(...schemaResult.error.errors.map(e => e.message))
        return result
      }

      // 2. Extension validation
      const extension = this.getFileExtension(input.filename)
      if (!this.isExtensionAllowed(extension, input.contentType)) {
        result.isValid = false
        result.errors.push(`File extension '${extension}' not allowed for content type '${input.contentType}'`)
        return result
      }

      // 3. Magic number validation
      const signatureResult = await this.validateFileSignature(input.buffer, input.contentType)
      result.detectedType = signatureResult.detectedType
      result.confidence = signatureResult.confidence
      
      if (!signatureResult.isValid) {
        result.isValid = false
        result.errors.push(signatureResult.error || 'File signature validation failed')
        return result
      }

      // 4. Size validation
      const maxSize = FILE_SIZE_LIMITS[input.contentType] || 10 * 1024 * 1024
      if (input.size > maxSize) {
        result.isValid = false
        result.errors.push(`File size ${input.size} bytes exceeds limit of ${maxSize} bytes for ${input.contentType}`)
        return result
      }

      // 5. Content validation for text files
      if (input.contentType.startsWith('text/')) {
        const contentValidation = await this.validateTextContent(input.buffer, input.contentType)
        if (!contentValidation.isValid) {
          result.isValid = false
          result.errors.push(...contentValidation.errors)
          return result
        }
      }

      // 6. Check if file type is blocked
      if (BLOCKED_FILE_TYPES.includes(input.contentType as any)) {
        result.isBlocked = true
        result.isValid = false
        result.errors.push(`File type '${input.contentType}' is blocked for security reasons`)
        return result
      }

      // 7. Add warnings for potential issues
      if (signatureResult.confidence < 0.8) {
        result.warnings.push('Low confidence in file type detection')
      }

      if (input.size > 10 * 1024 * 1024) {
        result.warnings.push('Large file detected - extended processing time expected')
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Validate file signature (magic numbers)
   */
  private async validateFileSignature(buffer: Buffer, expectedType: string): Promise<{
    isValid: boolean
    detectedType: string
    confidence: number
    error?: string
  }> {
    try {
      // Use file-type library for comprehensive detection
      const fileType = await fileTypeFromBuffer(buffer)
      
      if (!fileType) {
        return {
          isValid: false,
          detectedType: 'unknown',
          confidence: 0,
          error: 'Unable to determine file type'
        }
      }

      const detectedMime = fileType.mime
      const confidence = this.calculateConfidence(detectedMime, expectedType)

      // Check if detected type matches expected type
      if (detectedMime !== expectedType) {
        return {
          isValid: false,
          detectedType: detectedMime,
          confidence,
          error: `File type mismatch: expected ${expectedType}, detected ${detectedMime}`
        }
      }

      // Additional magic number verification for critical files
      if (this.requiresMagicNumberVerification(expectedType)) {
        const magicNumberValid = this.verifyMagicNumber(buffer, expectedType)
        if (!magicNumberValid) {
          return {
            isValid: false,
            detectedType: detectedMime,
            confidence: 0,
            error: 'Magic number verification failed'
          }
        }
      }

      return {
        isValid: true,
        detectedType: detectedMime,
        confidence
      }

    } catch (error) {
      return {
        isValid: false,
        detectedType: 'error',
        confidence: 0,
        error: `Signature validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Verify magic number for critical file types
   */
  private verifyMagicNumber(buffer: Buffer, mimeType: string): boolean {
    const signature = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES]
    if (!signature || signature.length === 0) return true

    // Check first bytes against signature
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false
      }
    }

    return true
  }

  /**
   * Calculate confidence score for file type detection
   */
  private calculateConfidence(detected: string, expected: string): number {
    if (detected === expected) return 1.0
    
    // Check if detected type is in same family
    const detectedFamily = detected.split('/')[0]
    const expectedFamily = expected.split('/')[0]
    
    if (detectedFamily === expectedFamily) {
      return 0.7 // Same family but different subtype
    }
    
    return 0.1 // Different type family
  }

  /**
   * Check if file type requires magic number verification
   */
  private requiresMagicNumberVerification(mimeType: string): boolean {
    return mimeType.startsWith('image/') || 
           mimeType === 'application/pdf' ||
           mimeType.startsWith('application/vnd.openxmlformats')
  }

  /**
   * Validate text file content
   */
  private async validateTextContent(buffer: Buffer, contentType: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const result = { isValid: true, errors: [] as string[] }
    
    try {
      const content = buffer.toString('utf-8')
      
      // Check for malicious content patterns
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ]
      
      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          result.isValid = false
          result.errors.push(`Potentially malicious content detected: ${pattern.source}`)
        }
      }
      
      // CSV specific validation
      if (contentType === 'text/csv') {
        // Basic CSV structure validation
        const lines = content.split('\n')
        if (lines.length === 0) {
          result.isValid = false
          result.errors.push('CSV file appears to be empty')
        }
      }
      
    } catch (error) {
      result.isValid = false
      result.errors.push(`Text content validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    return result
  }

  /**
   * Check if file extension is allowed for content type
   */
  private isExtensionAllowed(extension: string, contentType: string): boolean {
    const extensionMap: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    }
    
    const allowedExtensions = extensionMap[contentType] || []
    return allowedExtensions.includes(extension.toLowerCase())
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
  }

  /**
   * Generate safe filename
   */
  generateSafeFilename(originalName: string, tenantId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = this.getFileExtension(originalName)
    
    return `${tenantId}_${timestamp}_${random}${extension}`
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(buffer: Buffer): Promise<string> {
    const crypto = await import('node:crypto')
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }
}
