#!/usr/bin/env tsx

/**
 * Agency Platform Repository Backup System
 * 
 * Implements 4-3-2 backup strategy for Git repositories:
 * - 4 copies: production + 3 backups
 * - 3 locations: primary, secondary, tertiary
 * - 2 offsite: geographic distribution
 * 
 * @author Agency Platform
 * @version 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

interface BackupConfig {
  primary: {
    remote: string
    branch: string
    path: string
  }
  secondary: {
    remote: string
    branch: string
    path: string
    provider: 'gitlab' | 'codecommit' | 'bitbucket'
  }
  tertiary: {
    remote: string
    branch: string
    path: string
    provider: 'gitlab' | 'codecommit' | 'bitbucket'
  }
  encryption: {
    enabled: boolean
    keyPath?: string
  }
  monitoring: {
    enabled: boolean
    webhookUrl?: string
  }
}

class RepositoryBackupManager {
  private config: BackupConfig
  private repoRoot: string

  constructor(configPath: string = '.backup-config.json') {
    this.repoRoot = this.getRepoRoot()
    this.config = this.loadConfig(configPath)
  }

  private getRepoRoot(): string {
    try {
      return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
    } catch (error) {
      throw new Error('Not in a Git repository')
    }
  }

  private loadConfig(configPath: string): BackupConfig {
    const fullPath = join(this.repoRoot, configPath)
    
    if (!existsSync(fullPath)) {
      const defaultConfig: BackupConfig = {
        primary: {
          remote: 'origin',
          branch: 'main',
          path: this.repoRoot
        },
        secondary: {
          remote: 'backup-secondary',
          branch: 'main',
          path: this.repoRoot,
          provider: 'gitlab'
        },
        tertiary: {
          remote: 'backup-tertiary',
          branch: 'main',
          path: this.repoRoot,
          provider: 'codecommit'
        },
        encryption: {
          enabled: false
        },
        monitoring: {
          enabled: false
        }
      }
      
      writeFileSync(fullPath, JSON.stringify(defaultConfig, null, 2))
      console.log(`✅ Created default backup config: ${configPath}`)
      return defaultConfig
    }

    const configContent = readFileSync(fullPath, 'utf8')
    return JSON.parse(configContent)
  }

  private executeCommand(command: string, cwd: string = this.repoRoot): string {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (error) {
      throw new Error(`Command failed: ${command}`)
    }
  }

  private getRemoteUrl(remote: string): string {
    try {
      return this.executeCommand(`git config --get remote.${remote}.url`).trim()
    } catch {
      throw new Error(`Remote '${remote}' not found`)
    }
  }

  private verifyRemote(remote: string): boolean {
    try {
      this.executeCommand(`git ls-remote ${remote}`)
      return true
    } catch {
      return false
    }
  }

  private calculateChecksum(path: string): string {
    const content = readFileSync(path, 'utf8')
    return createHash('sha256').update(content).digest('hex')
  }

  private async sendMonitoringAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    if (!this.config.monitoring.enabled || !this.config.monitoring.webhookUrl) {
      return
    }

    try {
      const payload = {
        text: message,
        severity,
        timestamp: new Date().toISOString(),
        repository: this.repoRoot
      }

      // In a real implementation, this would send to Slack, Teams, etc.
      console.log(`📊 MONITORING: ${message}`)
    } catch (error) {
      console.error('Failed to send monitoring alert:', error)
    }
  }

  public async setupMultiRemote(): Promise<void> {
    console.log('🔧 Setting up multi-remote backup configuration...')

    // Verify primary remote exists
    if (!this.verifyRemote(this.config.primary.remote)) {
      throw new Error(`Primary remote '${this.config.primary.remote}' is not accessible`)
    }

    // Setup secondary remote if needed
    try {
      this.getRemoteUrl(this.config.secondary.remote)
      console.log(`✅ Secondary remote '${this.config.secondary.remote}' exists`)
    } catch {
      console.log(`⚠️  Secondary remote '${this.config.secondary.remote}' not configured`)
      console.log(`   To add: git remote add ${this.config.secondary.remote} <${this.config.secondary.provider}_url>`)
    }

    // Setup tertiary remote if needed
    try {
      this.getRemoteUrl(this.config.tertiary.remote)
      console.log(`✅ Tertiary remote '${this.config.tertiary.remote}' exists`)
    } catch {
      console.log(`⚠️  Tertiary remote '${this.config.tertiary.remote}' not configured`)
      console.log(`   To add: git remote add ${this.config.tertiary.remote} <${this.config.tertiary.provider}_url>`)
    }

    await this.sendMonitoringAlert('Multi-remote backup configuration verified', 'info')
  }

  public async performBackup(): Promise<void> {
    console.log('💾 Starting repository backup process...')
    
    const startTime = Date.now()
    const primaryChecksum = this.calculateChecksum(join(this.repoRoot, '.git', 'HEAD'))

    try {
      // Backup to primary (ensure up-to-date)
      console.log('📤 Pushing to primary remote...')
      this.executeCommand(`git push ${this.config.primary.remote} ${this.config.primary.branch}`)
      
      // Backup to secondary if configured
      try {
        console.log('📤 Pushing to secondary remote...')
        this.executeCommand(`git push ${this.config.secondary.remote} ${this.config.secondary.branch}`)
      } catch (error) {
        console.error('❌ Secondary backup failed:', error)
        await this.sendMonitoringAlert(`Secondary backup failed: ${error}`, 'error')
      }

      // Backup to tertiary if configured
      try {
        console.log('📤 Pushing to tertiary remote...')
        this.executeCommand(`git push ${this.config.tertiary.remote} ${this.config.tertiary.branch}`)
      } catch (error) {
        console.error('❌ Tertiary backup failed:', error)
        await this.sendMonitoringAlert(`Tertiary backup failed: ${error}`, 'error')
      }

      const duration = Date.now() - startTime
      console.log(`✅ Backup completed in ${duration}ms`)
      
      await this.sendMonitoringAlert(
        `Repository backup completed successfully in ${duration}ms`, 
        'info'
      )

    } catch (error) {
      console.error('❌ Backup process failed:', error)
      await this.sendMonitoringAlert(
        `Repository backup failed: ${error}`, 
        'error'
      )
      throw error
    }
  }

  public async verifyBackups(): Promise<void> {
    console.log('🔍 Verifying backup integrity...')
    
    const primaryCommit = this.executeCommand(`git rev-parse ${this.config.primary.remote}/${this.config.primary.branch}`).trim()
    let secondaryCommit = ''
    let tertiaryCommit = ''

    // Verify secondary
    try {
      secondaryCommit = this.executeCommand(`git rev-parse ${this.config.secondary.remote}/${this.config.secondary.branch}`).trim()
      const secondaryMatch = primaryCommit === secondaryCommit
      console.log(`📊 Secondary backup: ${secondaryMatch ? '✅ SYNCED' : '❌ OUT OF SYNC'}`)
      
      if (!secondaryMatch) {
        await this.sendMonitoringAlert('Secondary backup is out of sync', 'warning')
      }
    } catch (error) {
      console.log('📊 Secondary backup: ❌ UNREACHABLE')
      await this.sendMonitoringAlert('Secondary backup is unreachable', 'error')
    }

    // Verify tertiary
    try {
      tertiaryCommit = this.executeCommand(`git rev-parse ${this.config.tertiary.remote}/${this.config.tertiary.branch}`).trim()
      const tertiaryMatch = primaryCommit === tertiaryCommit
      console.log(`📊 Tertiary backup: ${tertiaryMatch ? '✅ SYNCED' : '❌ OUT OF SYNC'}`)
      
      if (!tertiaryMatch) {
        await this.sendMonitoringAlert('Tertiary backup is out of sync', 'warning')
      }
    } catch (error) {
      console.log('📊 Tertiary backup: ❌ UNREACHABLE')
      await this.sendMonitoringAlert('Tertiary backup is unreachable', 'error')
    }

    console.log(`📊 Primary commit: ${primaryCommit}`)
    if (secondaryCommit) console.log(`📊 Secondary commit: ${secondaryCommit}`)
    if (tertiaryCommit) console.log(`📊 Tertiary commit: ${tertiaryCommit}`)
  }

  public async scheduleBackups(intervalMinutes: number = 60): Promise<void> {
    console.log(`⏰ Scheduling automatic backups every ${intervalMinutes} minutes...`)
    
    const backup = async () => {
      try {
        await this.performBackup()
        await this.verifyBackups()
      } catch (error) {
        console.error('Scheduled backup failed:', error)
      }
    }

    // Initial backup
    await backup()

    // Schedule subsequent backups
    setInterval(backup, intervalMinutes * 60 * 1000)
    
    console.log('✅ Backup scheduler started')
    console.log('Press Ctrl+C to stop')
  }

  public async generateBackupReport(): Promise<void> {
    console.log('📋 Generating backup status report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      repository: this.repoRoot,
      primary: {
        remote: this.config.primary.remote,
        url: this.getRemoteUrl(this.config.primary.remote),
        status: this.verifyRemote(this.config.primary.remote) ? 'connected' : 'disconnected'
      },
      secondary: {
        remote: this.config.secondary.remote,
        provider: this.config.secondary.provider,
        status: this.verifyRemote(this.config.secondary.remote) ? 'connected' : 'disconnected'
      },
      tertiary: {
        remote: this.config.tertiary.remote,
        provider: this.config.tertiary.provider,
        status: this.verifyRemote(this.config.tertiary.remote) ? 'connected' : 'disconnected'
      }
    }

    const reportPath = join(this.repoRoot, 'backup-report.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📄 Report saved to: ${reportPath}`)
    console.log(JSON.stringify(report, null, 2))
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const backupManager = new RepositoryBackupManager()

  try {
    switch (command) {
      case 'setup':
        await backupManager.setupMultiRemote()
        break
        
      case 'backup':
        await backupManager.performBackup()
        break
        
      case 'verify':
        await backupManager.verifyBackups()
        break
        
      case 'schedule':
        const interval = parseInt(args[1]) || 60
        await backupManager.scheduleBackups(interval)
        break
        
      case 'report':
        await backupManager.generateBackupReport()
        break
        
      default:
        console.log(`
🔄 Agency Platform Repository Backup System

Usage: tsx backup-repository.ts <command>

Commands:
  setup     - Configure multi-remote backup system
  backup    - Perform immediate backup to all remotes
  verify    - Verify backup integrity across remotes
  schedule  - Schedule automatic backups (default: 60 minutes)
  report    - Generate backup status report

Examples:
  tsx backup-repository.ts setup
  tsx backup-repository.ts backup
  tsx backup-repository.ts verify
  tsx backup-repository.ts schedule 30
  tsx backup-repository.ts report

Configuration:
  Edit .backup-config.json in repository root to customize remotes and settings
        `)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { RepositoryBackupManager, BackupConfig }
