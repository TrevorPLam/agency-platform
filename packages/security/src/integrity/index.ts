/**
 * Artifact Integrity Verification
 * 
 * Provides cryptographic verification of build artifacts and files
 */

import { createHash, createHmac } from 'crypto'
import { existsSync, readFileSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { 
  IntegrityCheck, 
  SecurityScanResult,
  SecurityConfig
} from '../types'

export interface IntegrityOptions {
  algorithm: 'sha256' | 'sha384' | 'sha512'
  verifyArtifacts: boolean
  excludePatterns: string[]
}

export interface ArtifactInfo {
  path: string
  size: number
  hash: string
  algorithm: string
  lastModified: Date
}

export class IntegrityVerifier {
  private config: SecurityConfig['integrityVerification']

  constructor(config: SecurityConfig['integrityVerification']) {
    this.config = config
  }

  /**
   * Verify integrity of a file or directory
   */
  async verify(path: string, expectedHash?: string): Promise<IntegrityCheck> {
    if (!this.config.enabled) {
      throw new Error('Integrity verification is disabled in configuration')
    }

    const algorithm = this.config.algorithm
    const hash = this.calculateHash(path, algorithm)
    const verified = expectedHash ? hash === expectedHash : true

    return {
      algorithm,
      hash,
      verified,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Calculate hash for file or directory
   */
  private calculateHash(path: string, algorithm: string): string {
    if (!existsSync(path)) {
      throw new Error(`Path does not exist: ${path}`)
    }

    const stats = statSync(path)
    
    if (stats.isDirectory()) {
      return this.calculateDirectoryHash(path, algorithm)
    } else {
      return this.calculateFileHash(path, algorithm)
    }
  }

  /**
   * Calculate hash for a single file
   */
  private calculateFileHash(filePath: string, algorithm: string): string {
    const content = readFileSync(filePath)
    return createHash(algorithm).update(content).digest('hex')
  }

  /**
   * Calculate hash for a directory (recursive)
   */
  private calculateDirectoryHash(dirPath: string, algorithm: string): string {
    const { readdirSync, statSync } = require('fs')
    const { join } = require('path')
    
    const hash = createHash(algorithm)
    const files = this.getAllFiles(dirPath)
    
    // Sort files for consistent hash calculation
    files.sort()
    
    for (const file of files) {
      const relativePath = file.replace(dirPath, '').replace(/^[\/\\]/, '')
      const content = readFileSync(file)
      const stats = statSync(file)
      
      // Include file path, size, and content in hash
      hash.update(relativePath)
      hash.update(stats.size.toString())
      hash.update(content)
    }
    
    return hash.digest('hex')
  }

  /**
   * Get all files in directory recursively
   */
  private getAllFiles(dirPath: string): string[] {
    const { readdirSync, statSync } = require('fs')
    const { join } = require('path')
    
    let files: string[] = []
    
    try {
      const items = readdirSync(dirPath)
      
      for (const item of items) {
        const fullPath = join(dirPath, item)
        const stats = statSync(fullPath)
        
        if (stats.isDirectory()) {
          // Skip excluded patterns
          if (this.shouldExclude(fullPath)) {
            continue
          }
          files = files.concat(this.getAllFiles(fullPath))
        } else {
          // Skip excluded patterns
          if (this.shouldExclude(fullPath)) {
            continue
          }
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.warn(`Warning reading directory ${dirPath}:`, error)
    }
    
    return files
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(path: string): boolean {
    const excludePatterns = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.log',
      '**/.DS_Store',
      '**/Thumbs.db',
    ]
    
    const normalizedPath = path.replace(/\\/g, '/')
    
    return excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
      return regex.test(normalizedPath)
    })
  }

  /**
   * Generate integrity manifest for directory
   */
  async generateManifest(dirPath: string): Promise<{
    manifest: ArtifactInfo[]
    integrity: IntegrityCheck
  }> {
    const files = this.getAllFiles(dirPath)
    const manifest: ArtifactInfo[] = []
    
    for (const file of files) {
      try {
        const stats = statSync(file)
        const hash = this.calculateFileHash(file, this.config.algorithm)
        
        manifest.push({
          path: file,
          size: stats.size,
          hash,
          algorithm: this.config.algorithm,
          lastModified: stats.mtime,
        })
      } catch (error) {
        console.warn(`Warning processing file ${file}:`, error)
      }
    }
    
    // Calculate overall integrity
    const manifestHash = createHash(this.config.algorithm)
      .update(JSON.stringify(manifest.sort((a, b) => a.path.localeCompare(b.path))))
      .digest('hex')
    
    const integrity: IntegrityCheck = {
      algorithm: this.config.algorithm,
      hash: manifestHash,
      verified: true,
      timestamp: new Date().toISOString(),
    }
    
    return { manifest, integrity }
  }

  /**
   * Verify integrity against manifest
   */
  async verifyManifest(dirPath: string, manifest: ArtifactInfo[]): Promise<SecurityScanResult> {
    const issues: string[] = []
    const recommendations: string[] = []
    const verifiedFiles: string[] = []
    const modifiedFiles: string[] = []
    const missingFiles: string[] = []

    // Check each file in manifest
    for (const artifact of manifest) {
      if (!existsSync(artifact.path)) {
        missingFiles.push(artifact.path)
        continue
      }

      try {
        const currentHash = this.calculateFileHash(artifact.path, artifact.algorithm)
        const stats = statSync(artifact.path)
        
        if (currentHash !== artifact.hash) {
          modifiedFiles.push(artifact.path)
          issues.push(`File modified: ${artifact.path}`)
        } else {
          verifiedFiles.push(artifact.path)
        }
        
        // Check for suspicious size changes
        if (Math.abs(stats.size - artifact.size) > 1024) {
          recommendations.push(`Significant size change: ${artifact.path}`)
        }
        
      } catch (error) {
        issues.push(`Error verifying file: ${artifact.path} - ${error}`)
      }
    }

    // Check for new files
    const currentFiles = this.getAllFiles(dirPath)
    const manifestFiles = new Set(manifest.map(f => f.path))
    const newFiles = currentFiles.filter(f => !manifestFiles.has(f))
    
    if (newFiles.length > 0) {
      recommendations.push(`New files detected: ${newFiles.length} files`)
    }

    const status = issues.length > 0 ? 'failed' : 
                  recommendations.length > 0 ? 'warning' : 'passed'

    return {
      scanType: 'integrity',
      timestamp: new Date().toISOString(),
      status,
      summary: `Integrity check: ${verifiedFiles.length} verified, ${modifiedFiles.length} modified, ${missingFiles.length} missing`,
      details: {
        verifiedFiles: verifiedFiles.length,
        modifiedFiles: modifiedFiles.length,
        missingFiles: missingFiles.length,
        newFiles: newFiles.length,
        totalFiles: manifest.length,
      },
      recommendations,
    }
  }

  /**
   * Create HMAC signature for integrity verification
   */
  createSignature(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex')
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(data, secret)
    return signature === expectedSignature
  }

  /**
   * Generate integrity report
   */
  async generateReport(dirPath: string): Promise<{
    summary: SecurityScanResult
    manifest: ArtifactInfo[]
    recommendations: string[]
  }> {
    const { manifest, integrity } = await this.generateManifest(dirPath)
    const verification = await this.verifyManifest(dirPath, manifest)
    
    const recommendations = [
      ...verification.recommendations,
      'Store integrity manifest in secure location',
      'Regularly verify artifact integrity',
      'Implement automated integrity checks in CI/CD',
      'Use signed releases for critical artifacts',
    ]

    return {
      summary: verification,
      manifest,
      recommendations,
    }
  }

  /**
   * Export manifest to file
   */
  exportManifest(manifest: ArtifactInfo[], filePath: string): void {
    const content = JSON.stringify({
      generated: new Date().toISOString(),
      algorithm: this.config.algorithm,
      artifacts: manifest,
    }, null, 2)
    
    writeFileSync(filePath, content, 'utf-8')
  }

  /**
   * Import manifest from file
   */
  importManifest(filePath: string): ArtifactInfo[] {
    if (!existsSync(filePath)) {
      throw new Error(`Manifest file not found: ${filePath}`)
    }

    const content = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    if (!data.artifacts || !Array.isArray(data.artifacts)) {
      throw new Error('Invalid manifest file format')
    }

    return data.artifacts as ArtifactInfo[]
  }

  /**
   * Quick integrity check for CI/CD
   */
  async quickCheck(paths: string[]): Promise<{
    passed: boolean
    results: Array<{ path: string; hash: string; verified: boolean }>
  }> {
    const results = []
    let passed = true

    for (const path of paths) {
      try {
        const hash = this.calculateHash(path, this.config.algorithm)
        results.push({
          path,
          hash,
          verified: true,
        })
      } catch (error) {
        results.push({
          path,
          hash: '',
          verified: false,
        })
        passed = false
      }
    }

    return { passed, results }
  }
}

export * from '../types'
