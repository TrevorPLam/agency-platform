#!/usr/bin/env tsx

/**
 * Repository Audit Script
 * Comprehensive repository health analysis for Agency Platform
 * Analyzes repository structure, performance, and security
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { exit } from 'process';

interface AuditResult {
  timestamp: string;
  repository: {
    name: string;
    path: string;
    size: string;
    sizeBytes: number;
  };
  objects: {
    total: number;
    loose: number;
    packed: number;
    packs: number;
  };
  branches: {
    total: number;
    active: number;
    stale: number;
    merged: number;
  };
  performance: {
    statusTime: string;
    logTime: string;
    fetchTime?: string;
  };
  security: {
    secrets: boolean;
    largeFiles: Array<{ path: string; size: string }>;
    sensitiveFiles: string[];
  };
  structure: {
    directories: number;
    files: number;
    gitignore: boolean;
    gitattributes: boolean;
  };
  health: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

class RepositoryAuditor {
  private repoPath: string;
  private verbose: boolean;

  constructor(repoPath: string = process.cwd(), verbose: boolean = false) {
    this.repoPath = repoPath;
    this.verbose = verbose;
  }

  /**
   * Execute a shell command and return output
   */
  private exec(command: string, options: { silent?: boolean } = {}): string {
    try {
      const opts = {
        cwd: this.repoPath,
        encoding: 'utf8' as const,
        ...options
      };
      
      if (!options.silent && this.verbose) {
        console.log(`🔧 Executing: ${command}`);
      }
      
      return execSync(command, opts).toString().trim();
    } catch (error) {
      if (options.silent) {
        return '';
      }
      throw new Error(`Command failed: ${command} - ${error}`);
    }
  }

  /**
   * Get repository information
   */
  private getRepositoryInfo() {
    const repoPath = this.exec('git rev-parse --show-toplevel');
    const repoName = this.exec('git rev-parse --show-toplevel').split('/').pop();
    
    // Get repository size
    const sizeOutput = this.exec('du -sb .git');
    const sizeBytes = parseInt(sizeOutput.split('\t')[0]);
    const sizeHuman = this.exec('du -sh .git').split('\t')[0];

    return {
      name: repoName,
      path: repoPath,
      size: sizeHuman,
      sizeBytes
    };
  }

  /**
   * Analyze Git objects
   */
  private analyzeObjects() {
    const countObjects = this.exec('git count-objects -v');
    const lines = countObjects.split('\n');
    
    let total = 0;
    let loose = 0;
    let packed = 0;
    
    for (const line of lines) {
      const [key, value] = line.split(':').map(s => s.trim());
      switch (key) {
        case 'count':
          total = parseInt(value);
          break;
        case 'loose':
          loose = parseInt(value);
          break;
        case 'in-pack':
          packed = parseInt(value);
          break;
      }
    }

    // Count pack files
    const packDir = join(this.repoPath, '.git/objects/pack');
    let packs = 0;
    if (existsSync(packDir)) {
      packs = readdirSync(packDir).filter(f => f.endsWith('.pack')).length;
    }

    return { total, loose, packed, packs };
  }

  /**
   * Analyze branches
   */
  private analyzeBranches() {
    // Get all branches
    const allBranches = this.exec('git branch -a').split('\n').filter(b => b.trim());
    
    // Get local branches
    const localBranches = this.exec('git branch').split('\n').filter(b => b.trim());
    
    // Get merged branches
    const mergedBranches = this.exec('git branch --merged main').split('\n').filter(b => b.trim());
    
    // Find stale branches (no commits in 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let staleCount = 0;
    for (const branch of localBranches) {
      const branchName = branch.replace(/^\*?\s*/, '').trim();
      if (branchName === 'main') continue;
      
      try {
        const lastCommitDate = new Date(
          this.exec(`git log -1 --format=%cd ${branchName}`)
        );
        
        if (lastCommitDate < thirtyDaysAgo) {
          staleCount++;
        }
      } catch {
        // Branch might be inaccessible
        staleCount++;
      }
    }

    return {
      total: allBranches.length,
      active: localBranches.length,
      stale: staleCount,
      merged: mergedBranches.length - 1 // Exclude main branch
    };
  }

  /**
   * Measure performance metrics
   */
  private measurePerformance() {
    // Time git status
    const statusStart = Date.now();
    this.exec('git status', { silent: true });
    const statusTime = `${Date.now() - statusStart}ms`;

    // Time git log
    const logStart = Date.now();
    this.exec('git log --oneline -10', { silent: true });
    const logTime = `${Date.now() - logStart}ms`;

    // Time git fetch (if remote exists)
    let fetchTime: string | undefined;
    try {
      const fetchStart = Date.now();
      this.exec('git fetch --dry-run', { silent: true });
      fetchTime = `${Date.now() - fetchStart}ms`;
    } catch {
      // No remote or fetch failed
    }

    return { statusTime, logTime, fetchTime };
  }

  /**
   * Security analysis
   */
  private analyzeSecurity() {
    const issues: Array<{ path: string; size: string }> = [];
    const sensitiveFiles: string[] = [];
    let secrets = false;

    // Check for large files
    try {
      const largeFiles = this.exec(
        'git rev-list --objects --all | git cat-file --batch-check=\'%(objecttype) %(objectname) %(objectsize) %(rest)\' | sed -n \'s/^blob //p\' | sort -k2nr | head -20',
        { silent: true }
      );
      
      for (const line of largeFiles.split('\n')) {
        if (!line.trim()) continue;
        
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const size = parseInt(parts[1]);
          const path = parts.slice(2).join(' ');
          
          if (size > 10 * 1024 * 1024) { // > 10MB
            issues.push({
              path,
              size: this.formatBytes(size)
            });
          }
        }
      }
    } catch {
      // Command failed, skip large file analysis
    }

    // Check for sensitive files
    const sensitivePatterns = [
      '.env',
      '.env.local',
      '.env.*.local',
      'id_rsa',
      'id_ed25519',
      '*.pem',
      '*.key',
      '*.p12',
      '*.pfx',
      '.aws/credentials',
      '.kube/config'
    ];

    for (const pattern of sensitivePatterns) {
      try {
        const matches = this.exec(`git ls-files | grep -E "${pattern}"`, { silent: true });
        if (matches.trim()) {
          sensitiveFiles.push(...matches.split('\n').filter(f => f.trim()));
        }
      } catch {
        // No matches found
      }
    }

    // Basic secret detection (simple patterns)
    const secretPatterns = [
      'password',
      'secret',
      'token',
      'api_key',
      'private_key'
    ];

    try {
      const files = this.exec('git ls-files').split('\n').filter(f => f.trim());
      
      for (const file of files) {
        if (file.match(/\.(js|ts|json|yml|yaml|env|config)$/)) {
          try {
            const content = this.exec(`git show HEAD:${file}`, { silent: true });
            
            for (const pattern of secretPatterns) {
              if (content.toLowerCase().includes(pattern)) {
                secrets = true;
                break;
              }
            }
          } catch {
            // File might not exist in HEAD
          }
        }
      }
    } catch {
      // Skip secret detection
    }

    return {
      secrets,
      largeFiles: issues,
      sensitiveFiles
    };
  }

  /**
   * Analyze repository structure
   */
  private analyzeStructure() {
    let directories = 0;
    let files = 0;

    function countFiles(dir: string) {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          directories++;
          if (!item.startsWith('.') && item !== 'node_modules') {
            countFiles(fullPath);
          }
        } else {
          files++;
        }
      }
    }

    try {
      countFiles(this.repoPath);
    } catch {
      // Skip structure analysis if permissions issues
    }

    // Check for important files
    const gitignore = existsSync(join(this.repoPath, '.gitignore'));
    const gitattributes = existsSync(join(this.repoPath, '.gitattributes'));

    return {
      directories,
      files,
      gitignore,
      gitattributes
    };
  }

  /**
   * Calculate health score and recommendations
   */
  private calculateHealthScore(result: Omit<AuditResult, 'health'>) {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Repository size issues
    if (result.repository.sizeBytes > 1024 * 1024 * 1024) { // > 1GB
      score -= 15;
      issues.push('Repository is large (> 1GB)');
      recommendations.push('Consider running aggressive garbage collection');
      recommendations.push('Review large files and consider Git LFS');
    }

    // Object issues
    if (result.objects.loose > 1000) {
      score -= 10;
      issues.push('High number of loose objects');
      recommendations.push('Run git gc to clean up loose objects');
    }

    if (result.objects.packs > 20) {
      score -= 5;
      issues.push('Many pack files');
      recommendations.push('Consider repacking to consolidate pack files');
    }

    // Branch issues
    if (result.branches.stale > 10) {
      score -= 10;
      issues.push('Many stale branches');
      recommendations.push('Clean up stale branches');
    }

    // Performance issues
    const statusTimeMs = parseInt(result.performance.statusTime);
    if (statusTimeMs > 5000) { // > 5 seconds
      score -= 15;
      issues.push('git status is slow');
      recommendations.push('Enable fsmonitor with Watchman');
      recommendations.push('Optimize Git configuration');
    }

    // Security issues
    if (result.security.secrets) {
      score -= 20;
      issues.push('Potential secrets detected');
      recommendations.push('Review and remove sensitive data');
      recommendations.push('Add .gitignore rules for sensitive files');
    }

    if (result.security.largeFiles.length > 5) {
      score -= 10;
      issues.push('Many large files in repository');
      recommendations.push('Move large files to Git LFS');
      recommendations.push('Consider removing files from history');
    }

    // Structure issues
    if (!result.structure.gitignore) {
      score -= 5;
      issues.push('Missing .gitignore file');
      recommendations.push('Create comprehensive .gitignore');
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return { score, issues, recommendations };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Run complete repository audit
   */
  public async audit(): Promise<AuditResult> {
    console.log('🔍 Starting repository audit...');

    const repository = this.getRepositoryInfo();
    const objects = this.analyzeObjects();
    const branches = this.analyzeBranches();
    const performance = this.measurePerformance();
    const security = this.analyzeSecurity();
    const structure = this.analyzeStructure();

    const baseResult = {
      timestamp: new Date().toISOString(),
      repository,
      objects,
      branches,
      performance,
      security,
      structure
    };

    const health = this.calculateHealthScore(baseResult);

    return {
      ...baseResult,
      health
    };
  }

  /**
   * Print audit results
   */
  public printResults(result: AuditResult) {
    console.log('\n📊 Repository Audit Results');
    console.log('==========================\n');

    // Repository info
    console.log('📦 Repository Information:');
    console.log(`  Name: ${result.repository.name}`);
    console.log(`  Path: ${result.repository.path}`);
    console.log(`  Size: ${result.repository.size}`);
    console.log();

    // Objects
    console.log('🔢 Git Objects:');
    console.log(`  Total: ${result.objects.total.toLocaleString()}`);
    console.log(`  Loose: ${result.objects.loose.toLocaleString()}`);
    console.log(`  Packed: ${result.objects.packed.toLocaleString()}`);
    console.log(`  Pack files: ${result.objects.packs}`);
    console.log();

    // Branches
    console.log('🌿 Branches:');
    console.log(`  Total: ${result.branches.total}`);
    console.log(`  Active: ${result.branches.active}`);
    console.log(`  Stale: ${result.branches.stale}`);
    console.log(`  Merged: ${result.branches.merged}`);
    console.log();

    // Performance
    console.log('⚡ Performance:');
    console.log(`  git status: ${result.performance.statusTime}`);
    console.log(`  git log (10): ${result.performance.logTime}`);
    if (result.performance.fetchTime) {
      console.log(`  git fetch: ${result.performance.fetchTime}`);
    }
    console.log();

    // Security
    console.log('🔒 Security:');
    console.log(`  Secrets detected: ${result.security.secrets ? '⚠️ Yes' : '✅ No'}`);
    console.log(`  Large files: ${result.security.largeFiles.length}`);
    console.log(`  Sensitive files: ${result.security.sensitiveFiles.length}`);
    
    if (result.security.largeFiles.length > 0) {
      console.log('\n  Large files:');
      result.security.largeFiles.forEach(file => {
        console.log(`    - ${file.path} (${file.size})`);
      });
    }
    console.log();

    // Structure
    console.log('📁 Structure:');
    console.log(`  Directories: ${result.structure.directories.toLocaleString()}`);
    console.log(`  Files: ${result.structure.files.toLocaleString()}`);
    console.log(`  .gitignore: ${result.structure.gitignore ? '✅' : '❌'}`);
    console.log(`  .gitattributes: ${result.structure.gitattributes ? '✅' : '❌'}`);
    console.log();

    // Health
    console.log('🏥 Health Assessment:');
    console.log(`  Score: ${result.health.score}/100`);
    
    if (result.health.issues.length > 0) {
      console.log('\n  Issues:');
      result.health.issues.forEach(issue => {
        console.log(`    ❌ ${issue}`);
      });
    }
    
    if (result.health.recommendations.length > 0) {
      console.log('\n  Recommendations:');
      result.health.recommendations.forEach(rec => {
        console.log(`    💡 ${rec}`);
      });
    }
    console.log();

    // Overall status
    if (result.health.score >= 80) {
      console.log('🎉 Repository is in excellent health!');
    } else if (result.health.score >= 60) {
      console.log('✅ Repository is in good health with room for improvement.');
    } else if (result.health.score >= 40) {
      console.log('⚠️ Repository needs attention.');
    } else {
      console.log('🚨 Repository requires immediate attention.');
    }
  }

  /**
   * Save audit results to JSON file
   */
  public saveResults(result: AuditResult, filename?: string) {
    const defaultFilename = `repository-audit-${new Date().toISOString().split('T')[0]}.json`;
    const outputFile = filename || defaultFilename;
    
    const outputPath = join(this.repoPath, outputFile);
    require('fs').writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log(`\n📄 Results saved to: ${outputPath}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const save = args.includes('--save');
  const json = args.includes('--json');
  
  const auditor = new RepositoryAuditor(process.cwd(), verbose);
  
  try {
    const result = await auditor.audit();
    
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      auditor.printResults(result);
    }
    
    if (save) {
      auditor.saveResults(result);
    }
    
    // Exit with appropriate code based on health score
    if (result.health.score < 40) {
      exit(1);
    }
  } catch (error) {
    console.error('❌ Audit failed:', error);
    exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { RepositoryAuditor };
export type { AuditResult };
