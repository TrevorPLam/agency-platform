# Git Performance Optimization Guide

This guide covers Git performance optimization strategies for the Agency Platform monorepo, designed to maintain fast operations as the repository grows.

## Overview

The Agency Platform is a sophisticated monorepo with multiple applications, packages, and extensive commit history. As repositories scale, Git operations can slow down significantly. This guide provides proven optimization techniques based on 2026 best practices.

## Quick Start

### Apply Optimizations
```bash
# Run the optimization script
./scripts/setup/git-config.sh

# Enable background maintenance (Git 2.37+)
git maintenance start
```

### Verify Improvements
```bash
# Test command performance
time git status
time git log --oneline -10
time git fetch --prune
```

## Core Optimizations

### Memory and Buffer Configuration

These settings optimize memory usage for large repositories:

```bash
core.packedGitLimit = 512m      # Maximum memory for packed Git objects
core.packedGitWindowSize = 512m # Window size for delta compression
core.bigFileThreshold = 50m     # Files > 50MB are streamed, not loaded
pack.windowMemory = 100m        # Memory window for pack generation
pack.packSizeLimit = 100m        # Maximum pack file size
```

### File System Monitoring

Enable file system monitoring for dramatically faster `git status`:

```bash
# Requires Watchman installation
brew install watchman  # macOS
sudo apt install watchman  # Ubuntu

# Enable in Git
git config --global core.fsmonitor true
git config --global core.untrackedcache true
```

### Garbage Collection Optimization

Configure garbage collection for large repositories:

```bash
gc.auto = 256                    # Run GC when > 256 loose objects
gc.autoPackLimit = 30           # Pack when > 30 pack files
gc.pruneExpire = 2.weeks.ago    # Keep objects for 2 weeks
gc.aggressiveWindow = 250       # Delta compression window
```

## Advanced Techniques

### Sparse Checkout

For developers who only work with specific parts of the repository:

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

### Shallow Clones for CI/CD

Optimize CI/CD with shallow clones:

```bash
# Clone only recent history
git clone --depth 50 <repository-url>

# Clone without blobs (metadata only)
git clone --filter=blob:none <repository-url>

# Clone with size limit
git clone --filter=blob:limit=10m <repository-url>
```

### Background Maintenance

Modern Git (2.37+) includes built-in maintenance:

```bash
# Register repository for maintenance
git maintenance register

# Start background maintenance
git maintenance start

# Configure schedule
git config maintenance.strategy incremental

# Manual maintenance run
git maintenance run --task=gc
git maintenance run --task=commit-graph
git maintenance run --task=loose-objects
```

## Performance Monitoring

### Benchmark Commands

Track performance over time:

```bash
# Time common operations
time git status
time git add .
time git commit -m "test"

# Measure repository size
du -sh .git

# Count objects
git count-objects -vH

# Analyze pack files
git verify-pack -v .git/objects/pack/*.pack
```

### Repository Health Checks

Regular maintenance commands:

```bash
# Check repository integrity
git fsck

# Find large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -10

# Analyze repository statistics
git-sizer
```

## Maintenance Schedule

### Daily (Automated)
- `git maintenance run` (background tasks)
- Remote branch pruning
- Loose object cleanup

### Weekly (Manual)
- Repository size analysis
- Performance benchmarking
- Large file audit

### Monthly (Manual)
- Aggressive garbage collection
- Full repository health check
- Configuration review

## Troubleshooting

### Common Issues

**Slow git status:**
- Enable fsmonitor with Watchman
- Check for untracked file cache
- Verify .gitignore effectiveness

**Large repository size:**
- Run aggressive garbage collection
- Remove unnecessary large files from history
- Consider Git LFS for binary assets

**Memory issues:**
- Reduce buffer sizes in configuration
- Limit pack threads
- Use shallow clones for CI/CD

### Recovery Procedures

**Restore previous configuration:**
```bash
# Restore from backup
cp ~/.git-config-backup-YYYYMMDD-HHMMSS/gitconfig ~/.gitconfig
```

**Reset maintenance:**
```bash
git maintenance unregister
git config --global maintenance.strategy incremental
```

## Integration with Agency Platform

### CI/CD Optimization

The GitHub Actions workflow already uses:
- `fetch-depth: 0` for complete history (required for --affected)
- Shallow clones for performance where appropriate

### Development Workflow

Optimized daily workflow:
```bash
# Start development session
pnpm dev

# Regular maintenance (weekly)
git maintenance run

# Performance check (monthly)
./scripts/benchmark/git-performance.sh
```

## References

- [Git Performance Documentation](https://git-scm.com/docs/git-config)
- [Large Repository Management](https://wellarchitected.github.com/library/architecture/recommendations/scaling-git-repositories/large-git-repositories/)
- [Git Maintenance Guide](https://git-scm.com/docs/git-maintenance)

## Support

For performance issues or questions about Git optimization:
1. Check this guide for common solutions
2. Run the benchmark script to identify bottlenecks
3. Contact the DevOps team for repository-specific issues
