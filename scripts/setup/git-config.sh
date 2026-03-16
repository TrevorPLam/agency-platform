#!/bin/bash

# Git Performance Optimization Configuration
# Optimized for large monorepos like Agency Platform
# Based on 2026 best practices for Git performance at scale

set -euo pipefail

echo "🚀 Optimizing Git configuration for large repositories..."

# Backup existing configuration
BACKUP_DIR="$HOME/.git-config-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -f "$HOME/.gitconfig" ]; then
    cp "$HOME/.gitconfig" "$BACKUP_DIR/gitconfig"
fi

echo "📦 Backup created at: $BACKUP_DIR"

# Core performance optimizations for large repositories
echo "⚙️ Applying core performance optimizations..."

git config --global core.packedGitLimit 512m
git config --global core.packedGitWindowSize 512m
git config --global core.bigFileThreshold 50m
git config --global core.packedGitWindowSize 512m
git config --global core.packedGitLimit 512m

# Index and file system monitoring optimizations
echo "📊 Optimizing index and file system monitoring..."

# Enable untracked file cache for better status performance
git config --global core.untrackedcache true

# Enable file system monitor if available (requires external tool like watchman)
if command -v watchman &> /dev/null; then
    echo "👁️ Watchman detected, enabling fsmonitor..."
    git config --global core.fsmonitor true
else
    echo "⚠️ Watchman not found. fsmonitor requires external installation."
fi

# Compression and delta optimizations
echo "🗜️ Optimizing compression and delta settings..."

git config --global pack.windowMemory 100m
git config --global pack.packSizeLimit 100m
git config --global pack.threads 4
git config --global pack.deltaCacheSize 256m
git config --global pack.deltaCacheLimit 1500

# Garbage collection optimizations for large repos
echo "🧹 Optimizing garbage collection settings..."

git config --global gc.auto 256
git config --global gc.autoPackLimit 30
git config --global gc.aggressiveWindow 250
git config --global gc.pruneExpire 2.weeks.ago
git config --global gc.worktreePruneExpire 3.months.ago

# Fetch and push optimizations
echo "📡 Optimizing fetch and push performance..."

git config --global fetch.prune true
git config --global fetch.parallel 4
git config --global push.default simple
git config --global push.autoSetupRemote true

# Performance-specific optimizations for monorepos
echo "🏗️ Applying monorepo-specific optimizations..."

# Enable manyFiles optimization for repos with many files
git config --global feature.manyFiles true

# Optimized status for large repos
git config --global status.showUntrackedFiles normal

# Better handling of long paths (Windows compatibility)
git config --global core.longpaths true

# Maintenance strategy for large repositories
echo "🔧 Configuring maintenance strategy..."

# Register repository for background maintenance (if supported)
if git maintenance register 2>/dev/null; then
    echo "✅ Repository registered for background maintenance"
    
    # Configure incremental strategy (safer for large repos)
    git config --global maintenance.strategy incremental
    
    # Enable specific maintenance tasks
    git config --global maintenance.commit-graph.enabled true
    git config --global maintenance.prefetch.enabled true
    git config --global maintenance.loose-objects.enabled true
    git config --global maintenance.incremental-repack.enabled true
    git config --global maintenance.gc.enabled false  # Disabled for background safety
else
    echo "⚠️ Git maintenance not available in this Git version"
fi

# Sparse checkout configuration (optional, requires manual setup)
echo "🌲 Sparse checkout configuration available:"
echo "   To enable: git config core.sparseCheckout true"
echo "   Then configure: .git/info/sparse-checkout"

# Display current configuration
echo ""
echo "📋 Current Git performance configuration:"
echo "=========================================="

config_values=(
    "core.packedGitLimit"
    "core.packedGitWindowSize" 
    "core.bigFileThreshold"
    "core.untrackedcache"
    "core.fsmonitor"
    "pack.windowMemory"
    "pack.packSizeLimit"
    "pack.threads"
    "gc.auto"
    "gc.autoPackLimit"
    "fetch.prune"
    "fetch.parallel"
    "feature.manyFiles"
    "maintenance.strategy"
)

for config in "${config_values[@]}"; do
    value=$(git config --global --get "$config" 2>/dev/null || echo "not set")
    printf "%-30s = %s\n" "$config" "$value"
done

echo ""
echo "✅ Git performance optimization completed!"
echo ""
echo "📖 Next steps:"
echo "   1. Test Git operations (status, log, fetch) to verify improvements"
echo "   2. Consider installing Watchman for fsmonitor benefits"
echo "   3. Enable sparse checkout if you only work with specific directories"
echo "   4. Run 'git maintenance start' to enable background maintenance"
echo ""
echo "🔄 To restore previous configuration:"
echo "   cp $BACKUP_DIR/gitconfig ~/.gitconfig"
