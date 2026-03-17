import { Buffer } from 'node:buffer'
import { z } from 'zod'

// Virus scanning configuration
export const VirusScanConfigSchema = z.object({
  enabled: z.boolean().default(true),
  provider: z.enum(['virustotal', 'clamav', 'mock']).default('virustotal'),
  apiKey: z.string().optional(),
  timeout: z.number().default(30000), // 30 seconds
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1000), // 1 second
})

export type VirusScanConfig = z.infer<typeof VirusScanConfigSchema>

export interface ScanResult {
  isClean: boolean
  scanId: string
  threats: string[]
  scanTime: Date
  provider: string
  confidence: number
  details?: Record<string, unknown>
}

export interface ScanRequest {
  fileBuffer: Buffer
  filename: string
  fileSize: number
  checksum: string
  tenantId: string
}

export abstract class VirusScanner {
  protected config: VirusScanConfig

  constructor(config: VirusScanConfig) {
    this.config = config
  }

  abstract scanFile(request: ScanRequest): Promise<ScanResult>
  abstract getScanStatus(scanId: string): Promise<ScanResult | null>
}

/**
 * VirusTotal API implementation
 */
export class VirusTotalScanner extends VirusScanner {
  private baseUrl = 'https://www.virustotal.com/vtapi/v3'
  
  constructor(config: VirusScanConfig) {
    super(config)
    if (!config.apiKey) {
      throw new Error('VirusTotal API key is required')
    }
  }

  async scanFile(request: ScanRequest): Promise<ScanResult> {
    const scanId = `vt_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    try {
      // Upload file for scanning
      const uploadResult = await this.uploadFile(request)
      
      // Poll for results
      const result = await this.pollForResult(uploadResult.scan_id, scanId)
      
      return result
    } catch (error) {
      throw new Error(`VirusTotal scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getScanStatus(scanId: string): Promise<ScanResult | null> {
    // Extract VirusTotal scan ID from our scan ID
    const vtScanId = scanId.replace('vt_', '').split('_')[0]
    
    try {
      const response = await fetch(`${this.baseUrl}/files/${vtScanId}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.config.apiKey!,
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return this.parseVirusTotalResult(data, scanId)
    } catch (error) {
      return null
    }
  }

  private async uploadFile(request: ScanRequest): Promise<any> {
    const formData = new FormData()
    const blob = new Blob([request.fileBuffer])
    formData.append('file', blob, request.filename)

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'x-apikey': this.config.apiKey!,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async pollForResult(vtScanId: string, scanId: string, attempts = 0): Promise<ScanResult> {
    if (attempts >= this.config.retryAttempts) {
      throw new Error('Scan timeout - maximum retries exceeded')
    }

    const response = await fetch(`${this.baseUrl}/analyses/${vtScanId}`, {
      method: 'GET',
      headers: {
        'x-apikey': this.config.apiKey!,
      },
    })

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.data.attributes.status === 'completed') {
      return this.parseVirusTotalResult(data, scanId)
    } else if (data.data.attributes.status === 'queued') {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      return this.pollForResult(vtScanId, scanId, attempts + 1)
    } else {
      throw new Error(`Scan failed with status: ${data.data.attributes.status}`)
    }
  }

  private parseVirusTotalResult(data: any, scanId: string): ScanResult {
    const stats = data.data.attributes.stats
    const totalScans = stats.malicious + stats.suspicious + stats.undetected + stats.harmless + stats.timeout
    const maliciousRatio = totalScans > 0 ? stats.malicious / totalScans : 0

    const threats: string[] = []
    
    // Extract threat names from scan results
    Object.entries(data.data.attributes.results || {}).forEach(([engine, result]: [string, any]) => {
      if (result.category === 'malicious' && result.result) {
        threats.push(`${engine}: ${result.result}`)
      }
    })

    return {
      isClean: stats.malicious === 0 && stats.suspicious === 0,
      scanId,
      threats,
      scanTime: new Date(data.data.attributes.date),
      provider: 'virustotal',
      confidence: 1 - maliciousRatio,
      details: {
        stats,
        permalink: data.data.attributes.permalink,
        totalScans,
      }
    }
  }
}

/**
 * Mock scanner for development/testing
 */
export class MockVirusScanner extends VirusScanner {
  async scanFile(request: ScanRequest): Promise<ScanResult> {
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const scanId = `mock_${Date.now()}`
    
    // Mock logic: mark files with certain patterns as malicious
    const isSuspicious = request.filename.includes('test') || request.fileSize < 100
    
    return {
      isClean: !isSuspicious,
      scanId,
      threats: isSuspicious ? ['Mock threat detected'] : [],
      scanTime: new Date(),
      provider: 'mock',
      confidence: isSuspicious ? 0.3 : 0.9,
      details: {
        mock: true,
        filename: request.filename,
        size: request.fileSize,
      }
    }
  }

  async getScanStatus(scanId: string): Promise<ScanResult | null> {
    // Mock implementation - always return the same result
    return {
      isClean: true,
      scanId,
      threats: [],
      scanTime: new Date(),
      provider: 'mock',
      confidence: 0.9,
    }
  }
}

/**
 * Factory for creating virus scanners
 */
export class VirusScannerFactory {
  static create(config: VirusScanConfig): VirusScanner {
    switch (config.provider) {
      case 'virustotal':
        return new VirusTotalScanner(config)
      case 'mock':
        return new MockVirusScanner(config)
      default:
        throw new Error(`Unsupported virus scanner provider: ${config.provider}`)
    }
  }
}

/**
 * Virus scanning service with retry logic and caching
 */
export class VirusScanningService {
  private scanner: VirusScanner
  private scanCache = new Map<string, ScanResult>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor(config: VirusScanConfig) {
    this.scanner = VirusScannerFactory.create(config)
  }

  async scanFile(request: ScanRequest): Promise<ScanResult> {
    // Check cache first
    const cacheKey = `${request.checksum}_${request.fileSize}`
    const cached = this.scanCache.get(cacheKey)
    
    if (cached && (Date.now() - cached.scanTime.getTime()) < this.cacheTimeout) {
      return cached
    }

    // Perform scan
    const result = await this.scanner.scanFile(request)
    
    // Cache result
    this.scanCache.set(cacheKey, result)
    
    // Clean up old cache entries
    this.cleanupCache()
    
    return result
  }

  async getScanStatus(scanId: string): Promise<ScanResult | null> {
    return this.scanner.getScanStatus(scanId)
  }

  private cleanupCache(): void {
    const now = Date.now()
    
    for (const [key, result] of this.scanCache.entries()) {
      if (now - result.scanTime.getTime() > this.cacheTimeout) {
        this.scanCache.delete(key)
      }
    }
  }

  clearCache(): void {
    this.scanCache.clear()
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now()
    const entries = Array.from(this.scanCache.entries()).map(([key, result]) => ({
      key,
      age: now - result.scanTime.getTime()
    }))
    
    return {
      size: this.scanCache.size,
      entries
    }
  }
}
