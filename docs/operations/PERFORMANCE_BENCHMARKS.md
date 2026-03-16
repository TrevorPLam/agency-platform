# Performance Benchmarks Documentation

This document outlines the performance benchmarking system for the Agency Platform repository, providing insights into Git operation performance and trends over time.

## Overview

The performance benchmarking system measures Git command execution times, tracks performance trends, and provides recommendations for optimization. This helps maintain repository performance as it grows and scales.

## Benchmark Metrics

### Core Git Operations

The following Git operations are benchmarked:

- **git status** - Repository status check performance
- **git log** - History traversal performance  
- **git diff** - Change detection performance
- **git add** - Staging performance
- **git commit** - Commit creation performance
- **git checkout** - Branch switching performance
- **git merge** - Branch merging performance
- **git fetch** - Remote fetch performance (if remote available)
- **git push** - Remote push performance (if remote available)

### System Metrics

- **Git version** - Current Git version in use
- **Repository size** - Total .git directory size
- **Commit count** - Total number of commits
- **Branch count** - Total number of branches
- **Tag count** - Total number of tags

### Configuration Analysis

- **core.packedGitLimit** - Memory limit for packed objects
- **core.packedGitWindowSize** - Delta compression window
- **core.bigFileThreshold** - Large file handling threshold
- **gc.auto** - Automatic garbage collection trigger
- **maintenance.strategy** - Background maintenance strategy
- **fsmonitor** - File system monitor status

## Usage

### Running Benchmarks

```bash
# Basic benchmark
./scripts/benchmark/git-performance.ts

# Verbose output
./scripts/benchmark/git-performance.ts --verbose

# Save results for trend analysis
./scripts/benchmark/git-performance.ts --save

# Custom iterations (default: 3)
./scripts/benchmark/git-performance.ts --iterations=5

# View historical trends
./scripts/benchmark/git-performance.ts --trends
```

### Performance Categories

#### Excellent Performance
- **git status**: < 500ms
- **git log (10)**: < 200ms
- **git diff**: < 100ms
- **git add**: < 50ms
- **git commit**: < 200ms

#### Good Performance
- **git status**: 500ms - 2s
- **git log (10)**: 200ms - 1s
- **git diff**: 100ms - 500ms
- **git add**: 50ms - 200ms
- **git commit**: 200ms - 1s

#### Needs Optimization
- **git status**: > 2s
- **git log (10)**: > 1s
- **git diff**: > 500ms
- **git add**: > 200ms
- **git commit**: > 1s

## Performance Optimization Guide

### Slow git status (> 2s)

**Causes:**
- Large number of untracked files
- Inefficient .gitignore patterns
- Missing file system monitor

**Solutions:**
```bash
# Enable file system monitor (requires Watchman)
brew install watchman  # macOS
git config --global core.fsmonitor true
git config --global core.untrackedcache true

# Optimize .gitignore
# Place specific patterns in deeper directories
# Use efficient patterns (avoid wildcards where possible)
```

### Slow git log (> 1s)

**Causes:**
- Large repository history
- Many merge commits
- Inefficient graph traversal

**Solutions:**
```bash
# Limit history depth for common operations
git log --oneline -10  # Use specific commit ranges

# Enable commit graph
git maintenance run --task=commit-graph

# Consider history pruning for very old commits
git gc --prune=1.year.ago
```

### Slow git operations overall

**Causes:**
- Large repository size
- Fragmented pack files
- Insufficient memory configuration

**Solutions:**
```bash
# Optimize Git configuration
git config --global core.packedGitLimit 512m
git config --global core.packedGitWindowSize 512m
git config --global core.bigFileThreshold 50m

# Run aggressive garbage collection
git gc --aggressive

# Enable background maintenance
git maintenance register
git maintenance start
```

## Benchmark Results Analysis

### Performance Trends

The system tracks performance over time and identifies trends:

- **📈 Improving** - Performance getting better
- **📉 Degrading** - Performance getting worse  
- **➡️ Stable** - Performance consistent

### Health Indicators

#### Repository Size
- **< 100MB**: Excellent
- **100MB - 500MB**: Good
- **500MB - 1GB**: Needs attention
- **> 1GB**: Requires optimization

#### Object Count
- **< 50K objects**: Excellent
- **50K - 200K objects**: Good
- **200K - 500K objects**: Needs attention
- **> 500K objects**: Requires optimization

#### Loose Objects
- **< 100**: Excellent
- **100 - 1K**: Good
- **1K - 10K**: Needs attention
- **> 10K**: Requires garbage collection

## Automated Benchmarking

### GitHub Actions Integration

The benchmark script integrates with GitHub Actions for automated performance tracking:

```yaml
# Example workflow integration
- name: Run Performance Benchmarks
  run: |
    npx tsx scripts/benchmark/git-performance.ts --save --verbose
    
- name: Upload Benchmark Results
  uses: actions/upload-artifact@v4
  with:
    name: performance-benchmark-${{ github.run_number }}
    path: .git-performance-history.json
```

### Scheduled Benchmarks

Performance benchmarks run automatically:
- **Daily**: Basic performance checks
- **Weekly**: Comprehensive benchmark suite
- **Monthly**: Trend analysis and reporting

## Performance Monitoring Dashboard

### Metrics to Monitor

1. **Response Time Trends**
   - Track git status performance over time
   - Identify performance regressions
   - Monitor optimization effectiveness

2. **Repository Growth**
   - Track repository size growth
   - Monitor object count increases
   - Predict future performance needs

3. **Configuration Impact**
   - Measure impact of configuration changes
   - Track optimization effectiveness
   - Identify best practices

### Alert Thresholds

Set up alerts for performance degradation:

```bash
# Alert if git status exceeds 5 seconds
if [ $(git status --porcelain 2>&1 | wc -l) -gt 1000 ]; then
  echo "Alert: Too many untracked files"
fi

# Alert if repository size exceeds 1GB
REPO_SIZE=$(du -s .git | cut -f1)
if [ $REPO_SIZE -gt 1048576 ]; then  # 1GB in KB
  echo "Alert: Repository size exceeded 1GB"
fi
```

## Best Practices

### Regular Maintenance

1. **Weekly**: Run garbage collection
2. **Monthly**: Run aggressive GC
3. **Quarterly**: Review performance trends
4. **Annually**: Comprehensive repository audit

### Development Workflow

1. **Before major changes**: Run baseline benchmark
2. **After optimizations**: Verify improvements
3. **Regular monitoring**: Track performance trends
4. **Team training**: Share optimization techniques

### Repository Hygiene

1. **Clean .gitignore**: Prevent unnecessary files
2. **Regular cleanup**: Remove stale branches
3. **Large file handling**: Use Git LFS for binaries
4. **History management**: Avoid unnecessary history bloat

## Troubleshooting

### Common Issues

#### Benchmark Script Fails

**Problem**: Script fails to execute
**Solution**: 
```bash
# Install dependencies
npm install -g tsx

# Check Git installation
git --version

# Verify repository status
git status
```

#### Inconsistent Results

**Problem**: Benchmark results vary significantly
**Solution**:
```bash
# Increase iterations
./scripts/benchmark/git-performance.ts --iterations=10

# Close other applications
# Run multiple times and average

# Check system load
top  # macOS/Linux
tasklist  # Windows
```

#### Performance Regression

**Problem**: Performance degrades over time
**Solution**:
```bash
# Run maintenance
git maintenance run --all

# Check for large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -10

# Review recent changes
git log --oneline -20
```

## Integration with Agency Platform

### CI/CD Pipeline

The benchmark system integrates with existing CI/CD:

1. **Pre-build**: Performance baseline check
2. **Post-build**: Performance impact measurement
3. **Scheduled**: Automated performance monitoring

### Development Tools

Performance monitoring available in:
- **agency-admin**: Performance dashboard
- **CLI tools**: Quick performance checks
- **GitHub Actions**: Automated alerts

### Team Training

- **Onboarding**: Performance best practices
- **Regular training**: Optimization techniques
- **Documentation**: Performance guidelines

## Data Retention

### Historical Data

- **Benchmark results**: 30 days
- **Trend analysis**: 90 days
- **Performance reports**: 1 year

### Privacy Considerations

- No sensitive data collected
- Repository metadata only
- Anonymous performance metrics
- Local data storage only

## References

- [Git Performance Documentation](https://git-scm.com/docs/git-config)
- [Large Repository Optimization](https://wellarchitected.github.com/library/architecture/recommendations/scaling-git-repositories/large-git-repositories/)
- [Agency Platform Git Performance Guide](../development/GIT_PERFORMANCE.md)
