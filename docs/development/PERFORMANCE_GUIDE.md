# Git Performance Guide

This guide provides comprehensive instructions for maintaining optimal Git performance in the Agency Platform monorepo. It covers daily operations, optimization techniques, and troubleshooting.

## Quick Reference

### Daily Commands
```bash
# Fast status check
git status

# Efficient log viewing
git log --oneline -10

# Quick file changes
git diff --stat

# Clean up remote branches
git fetch --prune
```

### Performance Commands
```bash
# Run maintenance
git maintenance run

# Quick garbage collection
git gc

# Check repository health
./scripts/audit/repository-audit.ts

# Run performance benchmark
./scripts/benchmark/git-performance.ts
```

## Optimized Development Workflow

### 1. Repository Setup

When setting up a new development environment:

```bash
# Clone with optimization
git clone <repository-url>
cd agency-platform

# Apply performance configuration
./scripts/setup/git-config.sh

# Enable background maintenance
git maintenance register
git maintenance start

# Verify setup
./scripts/benchmark/git-performance.ts --save
```

### 2. Daily Development

#### Morning Setup
```bash
# Start development session
pnpm dev

# Quick repository check
git status
git fetch --prune
```

#### During Development
```bash
# Efficient status checks
git status --porcelain  # Faster for scripts
git status              # Full status

# View changes efficiently
git diff --stat         # Summary only
git diff               # Full diff when needed

# Log viewing
git log --oneline -5   # Recent commits
git log --graph --oneline -10  # Branch visualization
```

#### Before Committing
```bash
# Stage changes efficiently
git add .              # For many files
git add specific-file  # For single files

# Quick commit
git commit -m "feat: add feature"

# Push with pruning
git push --prune
```

### 3. Weekly Maintenance

```bash
# Run comprehensive maintenance
git maintenance run

# Clean up local branches
git remote prune origin

# Remove stale branches
git branch --merged main | grep -v main | xargs git branch -d

# Performance check
./scripts/benchmark/git-performance.ts --save
```

### 4. Monthly Deep Clean

```bash
# Aggressive garbage collection
git gc --aggressive

# Repository audit
./scripts/audit/repository-audit.ts --save

# Performance trends
./scripts/benchmark/git-performance.ts --trends

# Configuration review
git config --global --list | grep -E "(core|gc|maintenance)"
```

## Performance Optimization Techniques

### 1. Git Configuration

#### Essential Settings
```bash
# Memory optimization
git config --global core.packedGitLimit 512m
git config --global core.packedGitWindowSize 512m
git config --global core.bigFileThreshold 50m

# Performance optimization
git config --global core.untrackedcache true
git config --global feature.manyFiles true

# Garbage collection
git config --global gc.auto 256
git config --global gc.autoPackLimit 30
```

#### Advanced Settings
```bash
# File system monitoring (requires Watchman)
brew install watchman  # macOS
git config --global core.fsmonitor true

# Parallel operations
git config --global fetch.parallel 4
git config --global pack.threads 4

# Compression optimization
git config --global pack.deltaCacheSize 256m
git config --global pack.windowMemory 100m
```

### 2. Repository Structure

#### Efficient .gitignore
```gitignore
# Place specific ignores in subdirectories
# instead of top-level wildcards

# Good: Specific patterns
*.log
*.tmp
node_modules/

# Avoid: Broad patterns if possible
# *
```

#### Sparse Checkout (Advanced)
```bash
# Enable sparse checkout
git config core.sparseCheckout true

# Define directories to include
echo "apps/agency-admin/" > .git/info/sparse-checkout
echo "packages/ui/" >> .git/info/sparse-checkout
echo "packages/database/" >> .git/info/sparse-checkout

# Apply sparse checkout
git read-tree -mu HEAD
```

### 3. Large File Handling

#### Git LFS Setup
```bash
# Install Git LFS
git lfs install

# Track large file types
git lfs track "*.psd"
git lfs track "*.zip"
git lfs track "*.mp4"

# Commit .gitattributes
git add .gitattributes
git commit -m "feat: add Git LFS tracking"
```

#### Remove Large Files from History
```bash
# Find large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -10

# Remove specific file from history
git filter-repo --path path/to/large/file --invert-paths

# Force push (coordinate with team!)
git push origin --force --all
```

## Troubleshooting Performance Issues

### Slow git status

#### Symptoms
- `git status` takes > 2 seconds
- High CPU usage during status
- Slower performance over time

#### Solutions
```bash
# Enable untracked cache
git config --global core.untrackedcache true

# Install and enable file system monitor
brew install watchman  # macOS
git config --global core.fsmonitor true

# Optimize .gitignore
# Move specific patterns to deeper directories

# Run maintenance
git maintenance run --task=commit-graph
```

### Slow git operations overall

#### Symptoms
- All Git commands are slow
- Repository size growing rapidly
- High memory usage

#### Solutions
```bash
# Check repository size
du -sh .git

# Run garbage collection
git gc

# Aggressive cleanup
git gc --aggressive

# Check for large files
./scripts/audit/repository-audit.ts

# Optimize configuration
./scripts/setup/git-config.sh
```

### Memory Issues

#### Symptoms
- Out of memory errors
- System slowdown during Git operations
- High RAM usage

#### Solutions
```bash
# Reduce memory limits
git config --global core.packedGitLimit 256m
git config --global core.packedGitWindowSize 256m

# Reduce parallel operations
git config --global pack.threads 2
git config --global fetch.parallel 2

# Use shallower operations
git log --oneline -50  # Instead of full history
```

## Performance Monitoring

### Daily Checks

```bash
# Quick performance test
time git status
time git log --oneline -10

# Repository health
git count-objects -v
du -sh .git
```

### Weekly Analysis

```bash
# Comprehensive benchmark
./scripts/benchmark/git-performance.ts --save

# Repository audit
./scripts/audit/repository-audit.ts

# Performance trends
./scripts/benchmark/git-performance.ts --trends
```

### Monthly Review

```bash
# Full performance report
./scripts/benchmark/git-performance.ts --save --verbose

# Historical analysis
cat .git-performance-history.json | jq '.trends'

# Configuration review
git config --global --list | grep -E "(core|gc|maintenance|pack)"
```

## Team Best Practices

### Individual Developer

1. **Daily**: Quick performance checks
2. **Weekly**: Run maintenance tasks
3. **Monthly**: Review performance trends
4. **As needed**: Optimize configuration

### Team Coordination

1. **Communication**: Coordinate major operations
2. **Training**: Share optimization techniques
3. **Monitoring**: Track team-wide performance
4. **Standards**: Establish performance guidelines

### Repository Management

1. **Automation**: Set up scheduled maintenance
2. **Monitoring**: Automated performance alerts
3. **Documentation**: Keep performance guides updated
4. **Training**: Regular team training sessions

## Integration with Agency Platform

### Development Tools

- **VS Code**: GitLens for enhanced Git operations
- **CLI**: Custom performance scripts
- **Dashboard**: Performance monitoring in agency-admin

### CI/CD Integration

- **Pre-build**: Performance baseline checks
- **Post-build**: Performance impact measurement
- **Scheduled**: Automated maintenance

### Documentation

- **Performance Guide**: This document
- **Git Performance**: Advanced optimization
- **Benchmarking**: Performance measurement

## Emergency Procedures

### Repository Corruption

```bash
# Check repository integrity
git fsck

# Repair common issues
git fsck --full

# Restore from backup if needed
cp -r .git-gc-backup-*/.git/* .git/
```

### Performance Degradation

```bash
# Quick fix
git maintenance run --all

# Aggressive fix
git gc --aggressive

# Last resort: clone fresh
git clone <repository-url> fresh-repo
cd fresh-repo
# Copy uncommitted work from old repo
```

### Large File Recovery

```bash
# Identify problematic files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -20

# Create BFG repo cleaner
# (External tool for large file removal)
```

## Performance Metrics

### Target Performance

| Operation | Target | Acceptable | Critical |
|-----------|--------|-----------|----------|
| git status | < 500ms | < 2s | > 5s |
| git log (10) | < 200ms | < 1s | > 3s |
| git diff | < 100ms | < 500ms | > 1s |
| git add | < 50ms | < 200ms | > 500ms |
| git commit | < 200ms | < 1s | > 2s |

### Repository Health

| Metric | Excellent | Good | Needs Attention |
|--------|-----------|------|-----------------|
| Repository Size | < 100MB | < 500MB | > 500MB |
| Object Count | < 50K | < 200K | > 200K |
| Loose Objects | < 100 | < 1K | > 1K |
| Pack Files | < 10 | < 20 | > 20 |

## Resources and References

### Internal Documentation
- [Git Performance Optimization](GIT_PERFORMANCE.md)
- [Performance Benchmarks](../operations/PERFORMANCE_BENCHMARKS.md)
- [Repository Audit Guide](../operations/REPOSITORY_AUDIT.md)

### External Resources
- [Git Configuration Documentation](https://git-scm.com/docs/git-config)
- [Git Maintenance Guide](https://git-scm.com/docs/git-maintenance)
- [Large Repository Best Practices](https://wellarchitected.github.io/)

### Tools and Utilities
- **git-sizer**: Repository analysis tool
- **git-filter-repo**: History rewriting tool
- **BFG Repo-Cleaner**: Large file removal
- **Watchman**: File system monitor

## Support and Training

### Getting Help
1. Check this guide first
2. Run diagnostic scripts
3. Check performance benchmarks
4. Contact DevOps team

### Training Resources
- Team workshops on Git optimization
- Video tutorials on performance tuning
- One-on-one coaching for advanced techniques
- Regular performance review meetings

## Conclusion

Following this guide will help maintain optimal Git performance in the Agency Platform monorepo. Regular maintenance, proper configuration, and performance monitoring are key to a healthy repository.

Remember:
- **Prevention** is better than cure
- **Regular maintenance** prevents issues
- **Monitoring** catches problems early
- **Team coordination** ensures consistency

For additional support or questions, refer to the internal documentation or contact the DevOps team.
