import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Buffer } from 'node:buffer'
import { MockVirusScanner, VirusScanningService, VirusScannerFactory } from './virus-scanner'

// Mock fetch for VirusTotal tests
global.fetch = vi.fn()

describe('MockVirusScanner', () => {
  let scanner: MockVirusScanner

  beforeEach(() => {
    scanner = new MockVirusScanner({
      enabled: true,
      provider: 'mock',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    })
  })

  it('should scan clean files successfully', async () => {
    const cleanBuffer = Buffer.from('clean file content')
    const request = {
      fileBuffer: cleanBuffer,
      filename: 'clean.txt',
      fileSize: cleanBuffer.length,
      checksum: 'abc123',
      tenantId: 'tenant-123',
    }

    const result = await scanner.scanFile(request)

    expect(result.isClean).toBe(true)
    expect(result.threats).toHaveLength(0)
    expect(result.provider).toBe('mock')
    expect(result.confidence).toBe(0.9)
    expect(result.scanId).toMatch(/^mock_\d+$/)
  })

  it('should detect suspicious files', async () => {
    const suspiciousBuffer = Buffer.from('suspicious test content')
    const request = {
      fileBuffer: suspiciousBuffer,
      filename: 'test.txt', // Contains 'test' which triggers mock detection
      fileSize: suspiciousBuffer.length,
      checksum: 'def456',
      tenantId: 'tenant-123',
    }

    const result = await scanner.scanFile(request)

    expect(result.isClean).toBe(false)
    expect(result.threats).toContain('Mock threat detected')
    expect(result.confidence).toBe(0.3)
  })

  it('should detect very small files as suspicious', async () => {
    const tinyBuffer = Buffer.from('x') // Very small file
    const request = {
      fileBuffer: tinyBuffer,
      filename: 'tiny.txt',
      fileSize: tinyBuffer.length,
      checksum: 'tiny123',
      tenantId: 'tenant-123',
    }

    const result = await scanner.scanFile(request)

    expect(result.isClean).toBe(false)
    expect(result.threats).toContain('Mock threat detected')
  })

  it('should return scan status', async () => {
    const result = await scanner.getScanStatus('mock_1234567890')

    expect(result).not.toBeNull()
    expect(result!.isClean).toBe(true)
    expect(result!.scanId).toBe('mock_1234567890')
    expect(result!.provider).toBe('mock')
  })
})

describe('VirusScanningService', () => {
  let service: VirusScanningService

  beforeEach(() => {
    service = new VirusScanningService({
      enabled: true,
      provider: 'mock',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    })
  })

  it('should scan file and cache result', async () => {
    const testBuffer = Buffer.from('test content')
    const request = {
      fileBuffer: testBuffer,
      filename: 'test.txt',
      fileSize: testBuffer.length,
      checksum: 'checksum123',
      tenantId: 'tenant-123',
    }

    // First scan
    const result1 = await service.scanFile(request)

    expect(result1.isClean).toBe(false) // Mock scanner detects 'test' as suspicious
    expect(result1.scanId).toMatch(/^mock_\d+$/)

    // Second scan with same checksum should return cached result
    const result2 = await service.scanFile(request)

    expect(result2.scanId).toBe(result1.scanId) // Same scan ID from cache
    expect(result2.isClean).toBe(result1.isClean)
  })

  it('should not cache results with different checksums', async () => {
    const buffer1 = Buffer.from('content1')
    const buffer2 = Buffer.from('content2')

    const request1 = {
      fileBuffer: buffer1,
      filename: 'file1.txt',
      fileSize: buffer1.length,
      checksum: 'checksum1',
      tenantId: 'tenant-123',
    }

    const request2 = {
      fileBuffer: buffer2,
      filename: 'file2.txt',
      fileSize: buffer2.length,
      checksum: 'checksum2',
      tenantId: 'tenant-123',
    }

    const result1 = await service.scanFile(request1)
    const result2 = await service.scanFile(request2)

    expect(result1.scanId).not.toBe(result2.scanId)
  })

  it('should clear cache', async () => {
    const testBuffer = Buffer.from('test content')
    const request = {
      fileBuffer: testBuffer,
      filename: 'test.txt',
      fileSize: testBuffer.length,
      checksum: 'checksum123',
      tenantId: 'tenant-123',
    }

    // Scan and cache
    await service.scanFile(request)
    expect(service.getCacheStats().size).toBe(1)

    // Clear cache
    service.clearCache()
    expect(service.getCacheStats().size).toBe(0)
  })

  it('should provide cache statistics', async () => {
    const testBuffer = Buffer.from('test content')
    const request = {
      fileBuffer: testBuffer,
      filename: 'test.txt',
      fileSize: testBuffer.length,
      checksum: 'checksum123',
      tenantId: 'tenant-123',
    }

    await service.scanFile(request)
    const stats = service.getCacheStats()

    expect(stats.size).toBe(1)
    expect(stats.entries).toHaveLength(1)
    expect(stats.entries[0].age).toBeGreaterThanOrEqual(0)
  })
})

describe('VirusScannerFactory', () => {
  it('should create mock scanner', () => {
    const config = {
      enabled: true,
      provider: 'mock' as const,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    }

    const scanner = VirusScannerFactory.create(config)

    expect(scanner).toBeInstanceOf(MockVirusScanner)
  })

  it('should throw error for unsupported provider', () => {
    const config = {
      enabled: true,
      provider: 'unsupported' as any,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    }

    expect(() => VirusScannerFactory.create(config)).toThrow(
      'Unsupported virus scanner provider: unsupported'
    )
  })
})
