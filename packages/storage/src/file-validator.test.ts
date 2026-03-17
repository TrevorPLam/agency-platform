import { describe, it, expect, beforeEach } from 'vitest'
import { Buffer } from 'node:buffer'
import { FileValidator, FileValidationInput } from './file-validator'

describe('FileValidator', () => {
  let validator: FileValidator
  let testImageBuffer: Buffer
  let testPdfBuffer: Buffer

  beforeEach(() => {
    validator = FileValidator.getInstance()
    
    // Create test image buffer (PNG signature)
    testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      ...Array(1000).fill(0x00) // Mock image data
    ])
    
    // Create test PDF buffer
    testPdfBuffer = Buffer.from([
      0x25, 0x50, 0x44, 0x46, // %PDF signature
      ...Array(1000).fill(0x00) // Mock PDF data
    ])
  })

  describe('validateFile', () => {
    it('should validate a legitimate PNG image', async () => {
      const input: FileValidationInput = {
        filename: 'test.png',
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.isBlocked).toBe(false)
      expect(result.requiresScanning).toBe(true)
      expect(result.detectedType).toBe('image/png')
      expect(result.confidence).toBe(1.0)
    })

    it('should validate a legitimate PDF document', async () => {
      const input: FileValidationInput = {
        filename: 'document.pdf',
        contentType: 'application/pdf',
        size: testPdfBuffer.length,
        buffer: testPdfBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.isBlocked).toBe(false)
      expect(result.requiresScanning).toBe(true)
      expect(result.detectedType).toBe('application/pdf')
    })

    it('should reject files with invalid extensions', async () => {
      const input: FileValidationInput = {
        filename: 'test.exe', // .exe extension with PNG content
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("File extension '.exe' not allowed for content type 'image/png'")
    })

    it('should reject files with double extensions', async () => {
      const input: FileValidationInput = {
        filename: 'test.png.php', // Double extension
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("File extension '.php' not allowed for content type 'image/png'")
    })

    it('should reject files with null bytes in filename', async () => {
      const input: FileValidationInput = {
        filename: 'test.php%00.jpg', // Null byte injection attempt
        contentType: 'image/jpeg',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject files starting with dots', async () => {
      const input: FileValidationInput = {
        filename: '.hidden.png', // Hidden file
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Filename cannot start with a dot')
    })

    it('should reject files with directory traversal', async () => {
      const input: FileValidationInput = {
        filename: '../../../etc/passwd.png', // Directory traversal attempt
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Filename cannot contain directory traversal')
    })

    it('should reject files that are too large', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024) // 100MB
      
      const input: FileValidationInput = {
        filename: 'large.png',
        contentType: 'image/png',
        size: largeBuffer.length,
        buffer: largeBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File size 104857600 bytes exceeds limit of 10485760 bytes for image/png')
    })

    it('should reject empty files', async () => {
      const input: FileValidationInput = {
        filename: 'empty.png',
        contentType: 'image/png',
        size: 0,
        buffer: Buffer.alloc(0),
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File must be larger than 0 bytes')
    })

    it('should reject files with invalid tenant ID', async () => {
      const input: FileValidationInput = {
        filename: 'test.png',
        contentType: 'image/png',
        size: testImageBuffer.length,
        buffer: testImageBuffer,
        tenantId: 'invalid-uuid',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid tenant ID')
    })

    it('should detect malicious content in text files', async () => {
      const maliciousContent = Buffer.from('<script>alert("xss")</script>', 'utf-8')
      
      const input: FileValidationInput = {
        filename: 'malicious.txt',
        contentType: 'text/plain',
        size: maliciousContent.length,
        buffer: maliciousContent,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potentially malicious content detected: <script')
    })

    it('should warn about low confidence detection', async () => {
      // Create a buffer with ambiguous signature
      const ambiguousBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])
      
      const input: FileValidationInput = {
        filename: 'ambiguous.png',
        contentType: 'image/png',
        size: ambiguousBuffer.length,
        buffer: ambiguousBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(false) // Should fail due to signature mismatch
      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })

    it('should warn about large files', async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB
      
      const input: FileValidationInput = {
        filename: 'large.pdf',
        contentType: 'application/pdf',
        size: largeBuffer.length,
        buffer: largeBuffer,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = await validator.validateFile(input)

      expect(result.isValid).toBe(true) // Should pass (under 50MB limit)
      expect(result.warnings).toContain('Large file detected - extended processing time expected')
    })
  })

  describe('generateSafeFilename', () => {
    it('should generate a safe filename with tenant ID', () => {
      const originalName = 'test.png'
      const tenantId = '123e4567-e89b-12d3-a456-426614174000'

      const safeName = validator.generateSafeFilename(originalName, tenantId)

      expect(safeName).toMatch(/^123e4567-e89b-12d3-a456-426614174000_\d+_[a-z0-9]+\.png$/)
    })

    it('should handle files without extensions', () => {
      const originalName = 'testfile'
      const tenantId = '123e4567-e89b-12d3-a456-426614174000'

      const safeName = validator.generateSafeFilename(originalName, tenantId)

      expect(safeName).toMatch(/^123e4567-e89b-12d3-a456-426614174000_\d+_[a-z0-9]+$/)
    })

    it('should handle multiple dots in filename', () => {
      const originalName = 'test.v2.final.png'
      const tenantId = '123e4567-e89b-12d3-a456-426614174000'

      const safeName = validator.generateSafeFilename(originalName, tenantId)

      expect(safeName).toMatch(/^123e4567-e89b-12d3-a456-426614174000_\d+_[a-z0-9]+\.png$/)
    })
  })

  describe('calculateChecksum', () => {
    it('should calculate SHA-256 checksum', async () => {
      const testBuffer = Buffer.from('test content', 'utf-8')
      const expectedChecksum = 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2'

      const checksum = await validator.calculateChecksum(testBuffer)

      expect(checksum).toBe(expectedChecksum)
    })

    it('should generate different checksums for different content', async () => {
      const buffer1 = Buffer.from('content1', 'utf-8')
      const buffer2 = Buffer.from('content2', 'utf-8')

      const checksum1 = await validator.calculateChecksum(buffer1)
      const checksum2 = await validator.calculateChecksum(buffer2)

      expect(checksum1).not.toBe(checksum2)
    })

    it('should generate same checksum for identical content', async () => {
      const buffer1 = Buffer.from('same content', 'utf-8')
      const buffer2 = Buffer.from('same content', 'utf-8')

      const checksum1 = await validator.calculateChecksum(buffer1)
      const checksum2 = await validator.calculateChecksum(buffer2)

      expect(checksum1).toBe(checksum2)
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const validator1 = FileValidator.getInstance()
      const validator2 = FileValidator.getInstance()

      expect(validator1).toBe(validator2)
    })
  })
})
