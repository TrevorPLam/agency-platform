#!/usr/bin/env tsx

/**
 * Git Performance Benchmarking Script
 * Measures and tracks Git command performance over time
 * Provides insights into repository performance trends
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exit } from 'process';

interface BenchmarkResult {
  timestamp: string;
  gitVersion: string;
  repository: {
    name: string;
    path: string;
    size: string;
    sizeBytes: number;
    commitCount: number;
    branchCount: number;
    tagCount: number;
  };
  benchmarks: {
    status: PerformanceMetric;
    log: PerformanceMetric;
    diff: PerformanceMetric;
    add: PerformanceMetric;
    commit: PerformanceMetric;
    push?: PerformanceMetric;
    pull?: PerformanceMetric;
    clone?: PerformanceMetric;
    checkout: PerformanceMetric;
    merge: PerformanceMetric;
  };
  system: {
    platform: string;
    nodeVersion: string;
    cpuCount: number;
    memory: number;
  };
  configuration: {
    corePackedGitLimit: string;
    corePackedGitWindowSize: string;
    coreBigFileThreshold: string;
    gcAuto: string;
    maintenanceStrategy: string;
    fsmonitor: boolean;
  };
}

interface PerformanceMetric {
  timeMs: number;
  memoryUsage?: number;
  cpuUsage?: number;
  success: boolean;
  error?: string;
}

interface HistoricalData {
  results: BenchmarkResult[];
  trends: {
    [key: string]: {
      average: number;
      min: number;
      max: number;
      trend: 'improving' | 'degrading' | 'stable';
    };
  };
}

class GitPerformanceBenchmark {
  private repoPath: string;
  private verbose: boolean;
  private iterations: number;

  constructor(repoPath: string = process.cwd(), verbose: boolean = false, iterations: number = 3) {
    this.repoPath = repoPath;
    this.verbose = verbose;
    this.iterations = iterations;
  }

  /**
   * Execute a command and measure performance
   */
  private async measurePerformance(command: string, options: { silent?: boolean } = {}): Promise<PerformanceMetric> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      if (this.verbose) {
        console.log(`🔧 Measuring: ${command}`);
      }

      execSync(command, {
        cwd: this.repoPath,
        encoding: 'utf8',
        ...options
      });
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
    }

    const timeMs = Date.now() - start;

    return {
      timeMs,
      success,
      error
    };
  }

  /**
   * Run multiple iterations and calculate average
   */
  private async runBenchmark(command: string, options: { silent?: boolean } = {}): Promise<PerformanceMetric> {
    const results: PerformanceMetric[] = [];

    for (let i = 0; i < this.iterations; i++) {
      const result = await this.measurePerformance(command, options);
      
      if (!result.success) {
        return result; // Return first failure
      }
      
      results.push(result);
    }

    // Calculate average time
    const avgTimeMs = Math.round(results.reduce((sum, r) => sum + r.timeMs, 0) / results.length);

    return {
      timeMs: avgTimeMs,
      success: true
    };
  }

  /**
   * Get Git version
   */
  private getGitVersion(): string {
    try {
      return execSync('git --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get repository information
   */
  private getRepositoryInfo() {
    const repoPath = execSync('git rev-parse --show-toplevel', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    }).trim();
    
    const repoName = repoPath.split('/').pop() || 'unknown';
    
    // Get repository size
    const sizeOutput = execSync('du -sb .git', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    });
    const sizeBytes = parseInt(sizeOutput.split('\t')[0]);
    const sizeHuman = execSync('du -sh .git', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    }).split('\t')[0];

    // Get commit count
    const commitCount = parseInt(execSync('git rev-list --count HEAD', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    }).trim());

    // Get branch count
    const branchCount = execSync('git branch -a', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    }).split('\n').filter(b => b.trim()).length;

    // Get tag count
    const tagCount = execSync('git tag', { 
      cwd: this.repoPath, 
      encoding: 'utf8' 
    }).split('\n').filter(t => t.trim()).length;

    return {
      name: repoName,
      path: repoPath,
      size: sizeHuman,
      sizeBytes,
      commitCount,
      branchCount,
      tagCount
    };
  }

  /**
   * Get system information
   */
  private getSystemInfo() {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCount: require('os').cpus().length,
      memory: require('os').totalmem()
    };
  }

  /**
   * Get Git configuration
   */
  private getGitConfiguration() {
    const getConfig = (key: string): string => {
      try {
        return execSync(`git config --global --get ${key}`, { encoding: 'utf8' }).trim();
      } catch {
        return 'not set';
      }
    };

    return {
      corePackedGitLimit: getConfig('core.packedGitLimit'),
      corePackedGitWindowSize: getConfig('core.packedGitWindowSize'),
      coreBigFileThreshold: getConfig('core.bigFileThreshold'),
      gcAuto: getConfig('gc.auto'),
      maintenanceStrategy: getConfig('maintenance.strategy'),
      fsmonitor: getConfig('core.fsmonitor') === 'true'
    };
  }

  /**
   * Run all benchmarks
   */
  private async runBenchmarks() {
    const benchmarks: Partial<BenchmarkResult['benchmarks']> = {};

    // Basic operations
    benchmarks.status = await this.runBenchmark('git status', { silent: true });
    benchmarks.log = await this.runBenchmark('git log --oneline -10', { silent: true });
    benchmarks.diff = await this.runBenchmark('git diff --stat', { silent: true });
    benchmarks.checkout = await this.runBenchmark('git checkout HEAD', { silent: true });

    // File operations (create test file if needed)
    const testFile = join(this.repoPath, '.benchmark-test');
    try {
      // Add operation
      writeFileSync(testFile, `benchmark test ${Date.now()}`);
      benchmarks.add = await this.runBenchmark('git add .benchmark-test', { silent: true });
      
      // Commit operation
      benchmarks.commit = await this.runBenchmark('git commit -m "benchmark test"', { silent: true });
      
      // Clean up
      execSync('git reset --hard HEAD~1', { cwd: this.repoPath });
      execSync('rm -f .benchmark-test', { cwd: this.repoPath });
    } catch {
      benchmarks.add = { timeMs: 0, success: false, error: 'Failed to create test file' };
      benchmarks.commit = { timeMs: 0, success: false, error: 'Failed to create test file' };
    }

    // Merge operation (if there are branches)
    try {
      const branches = execSync('git branch', { 
        cwd: this.repoPath, 
        encoding: 'utf8' 
      }).split('\n').filter(b => b.trim() && !b.includes('* main') && !b.includes('* master'));
      
      if (branches.length > 0) {
        const testBranch = branches[0].replace(/^\*\s*/, '').trim();
        benchmarks.merge = await this.runBenchmark(`git merge ${testBranch}`, { silent: true });
        
        // Abort merge if it conflicts
        try {
          execSync('git merge --abort', { cwd: this.repoPath });
        } catch {
          // Merge might have succeeded, reset
          execSync('git reset --hard HEAD', { cwd: this.repoPath });
        }
      } else {
        benchmarks.merge = { timeMs: 0, success: false, error: 'No branches available for merge test' };
      }
    } catch {
      benchmarks.merge = { timeMs: 0, success: false, error: 'Merge test failed' };
    }

    // Remote operations (if remote exists)
    try {
      execSync('git remote get-url origin', { cwd: this.repoPath, encoding: 'utf8' });
      
      // Pull operation (dry run)
      benchmarks.pull = await this.runBenchmark('git fetch --dry-run', { silent: true });
      
      // Push operation (dry run)
      benchmarks.push = await this.runBenchmark('git push --dry-run', { silent: true });
    } catch {
      // No remote or remote operations failed
      benchmarks.pull = { timeMs: 0, success: false, error: 'No remote configured' };
      benchmarks.push = { timeMs: 0, success: false, error: 'No remote configured' };
    }

    return benchmarks as BenchmarkResult['benchmarks'];
  }

  /**
   * Run complete benchmark suite
   */
  public async run(): Promise<BenchmarkResult> {
    console.log('🚀 Starting Git performance benchmark...');
    console.log(`📊 Repository: ${this.repoPath}`);
    console.log(`🔄 Iterations: ${this.iterations}`);
    console.log();

    const gitVersion = this.getGitVersion();
    const repository = this.getRepositoryInfo();
    const system = this.getSystemInfo();
    const configuration = this.getGitConfiguration();
    const benchmarks = await this.runBenchmarks();

    return {
      timestamp: new Date().toISOString(),
      gitVersion,
      repository,
      benchmarks,
      system,
      configuration
    };
  }

  /**
   * Print benchmark results
   */
  public printResults(result: BenchmarkResult) {
    console.log('\n📊 Git Performance Benchmark Results');
    console.log('=====================================\n');

    // System info
    console.log('💻 System Information:');
    console.log(`  Platform: ${result.system.platform}`);
    console.log(`  Node.js: ${result.system.nodeVersion}`);
    console.log(`  CPU Cores: ${result.system.cpuCount}`);
    console.log(`  Memory: ${this.formatBytes(result.system.memory)}`);
    console.log();

    // Git info
    console.log('🔧 Git Information:');
    console.log(`  Version: ${result.gitVersion}`);
    console.log(`  Repository: ${result.repository.name}`);
    console.log(`  Size: ${result.repository.size}`);
    console.log(`  Commits: ${result.repository.commitCount.toLocaleString()}`);
    console.log(`  Branches: ${result.repository.branchCount}`);
    console.log(`  Tags: ${result.repository.tagCount}`);
    console.log();

    // Configuration
    console.log('⚙️ Configuration:');
    console.log(`  core.packedGitLimit: ${result.configuration.corePackedGitLimit}`);
    console.log(`  core.packedGitWindowSize: ${result.configuration.corePackedGitWindowSize}`);
    console.log(`  core.bigFileThreshold: ${result.configuration.coreBigFileThreshold}`);
    console.log(`  gc.auto: ${result.configuration.gcAuto}`);
    console.log(`  maintenance.strategy: ${result.configuration.maintenanceStrategy}`);
    console.log(`  fsmonitor: ${result.configuration.fsmonitor ? 'enabled' : 'disabled'}`);
    console.log();

    // Benchmark results
    console.log('⚡ Performance Benchmarks:');
    
    const benchmarks = [
      { name: 'git status', key: 'status' },
      { name: 'git log (10)', key: 'log' },
      { name: 'git diff --stat', key: 'diff' },
      { name: 'git add', key: 'add' },
      { name: 'git commit', key: 'commit' },
      { name: 'git checkout', key: 'checkout' },
      { name: 'git merge', key: 'merge' },
      { name: 'git fetch', key: 'pull' },
      { name: 'git push', key: 'push' }
    ];

    for (const benchmark of benchmarks) {
      const metric = result.benchmarks[benchmark.key as keyof BenchmarkResult['benchmarks']];
      
      if (metric) {
        const status = metric.success ? '✅' : '❌';
        const time = metric.success ? `${metric.timeMs}ms` : 'FAILED';
        const error = metric.error ? ` (${metric.error})` : '';
        
        console.log(`  ${status} ${benchmark.name.padEnd(20)}: ${time}${error}`);
      }
    }
    console.log();

    // Performance analysis
    this.analyzePerformance(result);
  }

  /**
   * Analyze performance and provide insights
   */
  private analyzePerformance(result: BenchmarkResult) {
    console.log('📈 Performance Analysis:');
    
    const benchmarks = result.benchmarks;
    
    // Status performance
    if (benchmarks.status.success) {
      if (benchmarks.status.timeMs > 5000) {
        console.log('  ⚠️ git status is slow (>5s) - consider enabling fsmonitor');
      } else if (benchmarks.status.timeMs > 2000) {
        console.log('  ⚠️ git status could be optimized');
      } else {
        console.log('  ✅ git status performance is good');
      }
    }

    // Log performance
    if (benchmarks.log.success) {
      if (benchmarks.log.timeMs > 1000) {
        console.log('  ⚠️ git log is slow - consider optimizing repository history');
      } else {
        console.log('  ✅ git log performance is good');
      }
    }

    // Repository size analysis
    const sizeMB = result.repository.sizeBytes / (1024 * 1024);
    if (sizeMB > 500) {
      console.log('  ⚠️ Large repository (>500MB) - consider garbage collection');
    } else if (sizeMB > 100) {
      console.log('  ⚠️ Repository is moderately large');
    } else {
      console.log('  ✅ Repository size is manageable');
    }

    // Configuration recommendations
    if (result.configuration.corePackedGitLimit === 'not set') {
      console.log('  💡 Consider setting core.packedGitLimit for large repositories');
    }

    if (!result.configuration.fsmonitor && benchmarks.status.timeMs > 2000) {
      console.log('  💡 Consider enabling fsmonitor with Watchman');
    }

    console.log();
  }

  /**
   * Load historical data
   */
  public loadHistoricalData(): HistoricalData {
    const dataFile = join(this.repoPath, '.git-performance-history.json');
    
    if (existsSync(dataFile)) {
      try {
        return JSON.parse(readFileSync(dataFile, 'utf8'));
      } catch {
        return { results: [], trends: {} };
      }
    }
    
    return { results: [], trends: {} };
  }

  /**
   * Save results and update trends
   */
  public saveResults(result: BenchmarkResult) {
    const dataFile = join(this.repoPath, '.git-performance-history.json');
    const historicalData = this.loadHistoricalData();
    
    // Add new result
    historicalData.results.push(result);
    
    // Keep only last 30 results
    if (historicalData.results.length > 30) {
      historicalData.results = historicalData.results.slice(-30);
    }
    
    // Calculate trends
    this.calculateTrends(historicalData);
    
    // Save updated data
    writeFileSync(dataFile, JSON.stringify(historicalData, null, 2));
    
    console.log(`📄 Results saved to: ${dataFile}`);
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(data: HistoricalData) {
    const benchmarks = ['status', 'log', 'diff', 'add', 'commit'];
    
    for (const benchmark of benchmarks) {
      const values = data.results
        .map(r => r.benchmarks[benchmark as keyof BenchmarkResult['benchmarks']])
        .filter(m => m && m.success)
        .map(m => m!.timeMs);
      
      if (values.length >= 3) {
        const recent = values.slice(-5);
        const older = values.slice(-10, -5);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
        
        let trend: 'improving' | 'degrading' | 'stable';
        const diff = (recentAvg - olderAvg) / olderAvg;
        
        if (diff < -0.1) {
          trend = 'improving';
        } else if (diff > 0.1) {
          trend = 'degrading';
        } else {
          trend = 'stable';
        }
        
        data.trends[benchmark] = {
          average: recentAvg,
          min: Math.min(...recent),
          max: Math.max(...recent),
          trend
        };
      }
    }
  }

  /**
   * Print historical trends
   */
  public printTrends() {
    const data = this.loadHistoricalData();
    
    if (data.results.length < 2) {
      console.log('📊 Not enough historical data for trends (need at least 2 benchmarks)');
      return;
    }
    
    console.log('\n📈 Performance Trends');
    console.log('====================');
    
    for (const [benchmark, trend] of Object.entries(data.trends)) {
      const icon = trend.trend === 'improving' ? '📈' : trend.trend === 'degrading' ? '📉' : '➡️';
      console.log(`  ${icon} ${benchmark.padEnd(15)}: ${trend.average.toFixed(0)}ms (${trend.trend})`);
    }
    
    console.log(`\n📊 Based on ${data.results.length} benchmark runs`);
    console.log(`📅 First: ${new Date(data.results[0].timestamp).toLocaleDateString()}`);
    console.log(`📅 Latest: ${new Date(data.results[data.results.length - 1].timestamp).toLocaleDateString()}`);
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
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const save = args.includes('--save');
  const trends = args.includes('--trends');
  const iterations = parseInt(args.find(a => a.startsWith('--iterations='))?.split('=')[1] || '3');
  
  const benchmark = new GitPerformanceBenchmark(process.cwd(), verbose, iterations);
  
  try {
    if (trends) {
      benchmark.printTrends();
      return;
    }
    
    const result = await benchmark.run();
    benchmark.printResults(result);
    
    if (save) {
      benchmark.saveResults(result);
      benchmark.printTrends();
    }
    
    // Exit with warning if any benchmark failed
    const failedBenchmarks = Object.values(result.benchmarks).filter(b => !b.success);
    if (failedBenchmarks.length > 0) {
      console.log(`\n⚠️ ${failedBenchmarks.length} benchmark(s) failed`);
      exit(1);
    }
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { GitPerformanceBenchmark };
export type { BenchmarkResult };
