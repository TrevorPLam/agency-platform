#!/bin/bash

# Advanced Git Performance Tuning for Large Monorepos
# Optimized for Agency Platform monorepo with 2026 best practices
# Goes beyond basic optimization with advanced tuning for scale

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo $PWD)"
BACKUP_DIR="$HOME/.git-performance-backup-$(date +%Y%m%d-%H%M%S)"

# Performance profiles
declare -A PROFILES=(
    ["minimal"]="Basic optimizations for small teams"
    ["standard"]="Recommended for most monorepos"
    ["aggressive"]="Maximum performance for large teams"
    ["enterprise"]="Enterprise-grade with monitoring"
)

echo -e "${BLUE}🚀 Advanced Git Performance Tuning${NC}"
echo -e "${BLUE}===================================${NC}"

# Function to check Git version and capabilities
check_git_capabilities() {
    echo -e "${YELLOW}🔍 Checking Git capabilities...${NC}"
    
    local git_version=$(git --version | cut -d' ' -f3)
    echo -e "${GREEN}✅ Git version: $git_version${NC}"
    
    # Check for advanced features
    local features=()
    
    if git config --global --get-all core.packedGitLimit >/dev/null 2>&1; then
        features+=("Memory optimization available")
    fi
    
    if git config --global --get-all core.untrackedcache >/dev/null 2>&1; then
        features+=("Untracked cache available")
    fi
    
    if command -v watchman &> /dev/null; then
        features+=("File system monitor (watchman) available")
    fi
    
    if git config --global --get-all maintenance.repo >/dev/null 2>&1; then
        features+=("Background maintenance available")
    fi
    
    if git config --global --get-all feature.experimental >/dev/null 2>&1; then
        features+=("Experimental features available")
    fi
    
    if [ ${#features[@]} -gt 0 ]; then
        echo -e "${GREEN}🎯 Available features:${NC}"
        for feature in "${features[@]}"; do
            echo -e "  - $feature"
        done
    fi
}

# Function to backup current configuration
backup_configuration() {
    echo -e "${YELLOW}📦 Backing up current Git configuration...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup global config
    if [ -f "$HOME/.gitconfig" ]; then
        cp "$HOME/.gitconfig" "$BACKUP_DIR/global-gitconfig"
    fi
    
    # Backup local config
    if [ -f "$REPO_ROOT/.git/config" ]; then
        cp "$REPO_ROOT/.git/config" "$BACKUP_DIR/local-gitconfig"
    fi
    
    # Backup system config if exists
    if [ -f "/etc/gitconfig" ]; then
        cp "/etc/gitconfig" "$BACKUP_DIR/system-gitconfig"
    fi
    
    echo -e "${GREEN}✅ Configuration backed up to: $BACKUP_DIR${NC}"
}

# Function to apply minimal performance profile
apply_minimal_profile() {
    echo -e "${CYAN}🔧 Applying minimal performance profile...${NC}"
    
    # Basic memory optimizations
    git config --global core.packedGitLimit 256m
    git config --global core.packedGitWindowSize 256m
    git config --global core.bigFileThreshold 50m
    
    # Basic compression
    git config --global pack.windowMemory 50m
    git config --global pack.packSizeLimit 50m
    git config --global pack.threads 2
    
    # Basic index optimization
    git config --global core.preloadindex true
    
    echo -e "${GREEN}✅ Minimal profile applied${NC}"
}

# Function to apply standard performance profile
apply_standard_profile() {
    echo -e "${CYAN}🔧 Applying standard performance profile...${NC}"
    
    # Memory optimizations (higher than minimal)
    git config --global core.packedGitLimit 512m
    git config --global core.packedGitWindowSize 512m
    git config --global core.bigFileThreshold 50m
    
    # Compression and delta optimizations
    git config --global pack.windowMemory 100m
    git config --global pack.packSizeLimit 100m
    git config --global pack.threads 4
    git config --global pack.deltaCacheSize 128m
    git config --global pack.deltaCacheLimit 1000
    
    # Index and file system optimizations
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global core.untrackedcache true
    
    # Performance flags
    git config --global core.loosecompression 1
    git config --global core.compression 6
    git config --global pack.compression 6
    git config --global pack.depth 50
    
    # Status and diff optimizations
    git config --global status.showUntrackedFiles normal
    git config --global diff.algorithm histogram
    
    echo -e "${GREEN}✅ Standard profile applied${NC}"
}

# Function to apply aggressive performance profile
apply_aggressive_profile() {
    echo -e "${CYAN}🔧 Applying aggressive performance profile...${NC}"
    
    # Maximum memory optimizations
    git config --global core.packedGitLimit 1024m
    git config --global core.packedGitWindowSize 1024m
    git config --global core.bigFileThreshold 100m
    
    # Aggressive compression
    git config --global pack.windowMemory 200m
    git config --global pack.packSizeLimit 200m
    git config --global pack.threads 8
    git config --global pack.deltaCacheSize 256m
    git config --global pack.deltaCacheLimit 2000
    
    # Advanced index optimizations
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global core.untrackedcache true
    
    # Performance tuning
    git config --global core.loosecompression 0
    git config --global core.compression 9
    git config --global pack.compression 9
    git config --global pack.depth 0
    git config --global pack.useBitmaps true
    git config --global pack.writeBitmapHashCache true
    
    # Status and diff optimizations
    git config --global status.showUntrackedFiles no
    git config --global diff.algorithm histogram
    git config --global diff.renames true
    git config --global diff.renameLimit 1000
    
    # Experimental features (if available)
    if git config --global --get-all feature.experimental >/dev/null 2>&1; then
        git config --global feature.experimental true
    fi
    
    echo -e "${GREEN}✅ Aggressive profile applied${NC}"
}

# Function to apply enterprise performance profile
apply_enterprise_profile() {
    echo -e "${CYAN}🔧 Applying enterprise performance profile...${NC}"
    
    # Apply aggressive profile first
    apply_aggressive_profile
    
    # Enterprise-specific settings
    git config --global core.packedGitLimit 2048m
    git config --global core.packedGitWindowSize 2048m
    git config --global pack.windowMemory 400m
    git config --global pack.packSizeLimit 400m
    git config --global pack.threads 16
    
    # Monitoring and logging
    git config --global core.logallrefupdates true
    git config --global gc.logexpiry 90.days
    git config --global gc.reflogexpire 90.days
    
    # Enterprise security and compliance
    git config --global core.packedGitUseCrc32 true
    git config --global core.packedGitOpenMemoryLimit 512m
    
    # Advanced maintenance
    git config --global maintenance.auto true
    git config --global maintenance.repo true
    
    # Background maintenance scheduling
    git config --global maintenance.gc.auto true
    git config --global maintenance.gc.autoDetach true
    
    echo -e "${GREEN}✅ Enterprise profile applied${NC}"
}

# Function to enable file system monitoring
enable_filesystem_monitoring() {
    echo -e "${YELLOW}👁️ Enabling file system monitoring...${NC}"
    
    # Check for watchman
    if command -v watchman &> /dev/null; then
        echo -e "${GREEN}✅ Watchman detected, enabling fsmonitor...${NC}"
        git config --global core.fsmonitor true
        git config --global core.fsmonitorhook .git/hooks/fsmonitor-watchman
        
        # Create fsmonitor hook if it doesn't exist
        if [ ! -f "$REPO_ROOT/.git/hooks/fsmonitor-watchman" ]; then
            cat > "$REPO_ROOT/.git/hooks/fsmonitor-watchman" << 'EOF'
#!/usr/bin/env bash
# Watchman-based file system monitor hook
watchman-watch-del "$PWD/.git" >/dev/null 2>&1 || true
watchman trigger "$PWD/.git" '.git/objects' '.git/refs' '.git/index' >/dev/null 2>&1 || true
EOF
            chmod +x "$REPO_ROOT/.git/hooks/fsmonitor-watchman"
            echo -e "${GREEN}✅ Created fsmonitor hook${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Watchman not found. Install watchman for better performance:${NC}"
        echo -e "${YELLOW}   macOS: brew install watchman${NC}"
        echo -e "${YELLOW}   Ubuntu: sudo apt install watchman${NC}"
        echo -e "${YELLOW}   Windows: choco install watchman${NC}"
    fi
}

# Function to enable background maintenance
enable_background_maintenance() {
    echo -e "${YELLOW}🔄 Enabling background maintenance...${NC}"
    
    # Check if maintenance is available (Git 2.37+)
    if git maintenance --help >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Git maintenance available, enabling...${NC}"
        
        # Register and start maintenance
        git maintenance register
        git maintenance start
        
        # Configure maintenance tasks
        git config --global maintenance.gc.auto true
        git config --global maintenance.gc.autoDetach true
        git config --global maintenance.prefetch.auto true
        git config --global maintenance.commitgraph.auto true
        git config --global maintenance.looseobjects.auto true
        
        echo -e "${GREEN}✅ Background maintenance enabled${NC}"
        echo -e "${BLUE}📋 Maintenance schedule:${NC}"
        echo -e "   - Prefetch: hourly"
        echo -e "   - Loose objects: daily"
        echo -e "   - Commit graph: weekly"
        echo -e "   - Garbage collection: weekly"
    else
        echo -e "${YELLOW}⚠️ Git maintenance not available (requires Git 2.37+)${NC}"
        echo -e "${YELLOW}   Consider upgrading Git for automatic maintenance${NC}"
    fi
}

# Function to optimize repository structure
optimize_repository_structure() {
    echo -e "${YELLOW}🏗️ Optimizing repository structure...${NC}"
    
    # Run garbage collection with aggressive settings
    echo -e "${BLUE}🧹 Running aggressive garbage collection...${NC}"
    git gc --aggressive --prune=now
    
    # Repack with optimal settings
    echo -e "${BLUE}📦 Repacking with optimal settings...${NC}"
    git repack -ad --depth=250 --window=250
    
    # Optimize pack files
    echo -e "${BLUE}🗜️ Optimizing pack files...${NC}"
    git pack-refs --all
    
    # Prune loose objects
    echo -e "${BLUE}🧹 Pruning loose objects...${NC}"
    git prune --expire=now
    
    echo -e "${GREEN}✅ Repository structure optimized${NC}"
}

# Function to configure hooks for performance
configure_performance_hooks() {
    echo -e "${YELLOW}🪝 Configuring performance hooks...${NC}"
    
    # Create pre-commit hook for performance monitoring
    if [ ! -f "$REPO_ROOT/.git/hooks/pre-commit" ]; then
        cat > "$REPO_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Performance monitoring pre-commit hook

# Check repository size
REPO_SIZE=$(du -sk .git | cut -f1)
if [ "$REPO_SIZE" -gt 100000 ]; then
    echo "⚠️ Large repository detected (${REPO_SIZE}KB). Consider running 'git gc --aggressive'"
fi

# Check for large files
LARGE_FILES=$(find . -type f -size +50M -not -path "./.git/*" | wc -l)
if [ "$LARGE_FILES" -gt 0 ]; then
    echo "⚠️ Found $LARGE_FILES large files (>50MB). Consider Git LFS."
fi

# Check for many loose objects
LOOSE_OBJECTS=$(git count-objects -v | grep "in-pack" | awk '{print $4}')
if [ "$LOOSE_OBJECTS" -gt 10000 ]; then
    echo "⚠️ Many loose objects detected. Consider running 'git gc'"
fi

exit 0
EOF
        chmod +x "$REPO_ROOT/.git/hooks/pre-commit"
        echo -e "${GREEN}✅ Performance monitoring pre-commit hook created${NC}"
    fi
    
    # Create post-checkout hook for performance optimization
    if [ ! -f "$REPO_ROOT/.git/hooks/post-checkout" ]; then
        cat > "$REPO_ROOT/.git/hooks/post-checkout" << 'EOF'
#!/bin/bash
# Performance optimization post-checkout hook

# Only run on branch checkout, not file checkout
if [ "$3" = "1" ]; then
    # Update index asynchronously
    git update-index --refresh >/dev/null 2>&1 &
    
    # Preload common files
    if [ -f "package.json" ]; then
        git update-index --add --cacheinfo 100644 $(git ls-files | head -10) >/dev/null 2>&1 &
    fi
fi

exit 0
EOF
        chmod +x "$REPO_ROOT/.git/hooks/post-checkout"
        echo -e "${GREEN}✅ Performance optimization post-checkout hook created${NC}"
    fi
}

# Function to benchmark Git performance
benchmark_performance() {
    echo -e "${BLUE}⚡ Benchmarking Git performance...${NC}"
    
    # Warm up
    git status >/dev/null 2>&1
    
    echo -e "${BLUE}📊 Performance Metrics:${NC}"
    
    # Benchmark git status
    local status_time=$(time (git status >/dev/null) 2>&1 | grep real | awk '{print $2}')
    echo -e "${GREEN}  git status: $status_time${NC}"
    
    # Benchmark git log
    local log_time=$(time (git log --oneline -10 >/dev/null) 2>&1 | grep real | awk '{print $2}')
    echo -e "${GREEN}  git log --oneline -10: $log_time${NC}"
    
    # Benchmark git diff
    local diff_time=$(time (git diff HEAD~1 --stat >/dev/null) 2>&1 | grep real | awk '{print $2}')
    echo -e "${GREEN}  git diff HEAD~1 --stat: $diff_time${NC}"
    
    # Benchmark git add (if there are changes)
    if [ -n "$(git status --porcelain)" ]; then
        local add_time=$(time (git add . >/dev/null) 2>&1 | grep real | awk '{print $2}')
        echo -e "${GREEN}  git add .: $add_time${NC}"
    fi
    
    # Repository statistics
    echo -e "${BLUE}📈 Repository Statistics:${NC}"
    
    local total_files=$(find . -type f ! -path "./.git/*" | wc -l)
    echo -e "${GREEN}  Total files: $total_files${NC}"
    
    local repo_size=$(du -sh .git | cut -f1)
    echo -e "${GREEN}  .git size: $repo_size${NC}"
    
    local pack_files=$(find .git/objects/pack -name "*.pack" | wc -l)
    echo -e "${GREEN}  Pack files: $pack_files${NC}"
    
    local loose_objects=$(git count-objects -v | grep "in-pack" | awk '{print $4}')
    echo -e "${GREEN}  Loose objects: $loose_objects${NC}"
}

# Function to show current configuration
show_configuration() {
    echo -e "${BLUE}📋 Current Git Configuration:${NC}"
    echo -e "${BLUE}=============================${NC}"
    
    # Performance-related settings
    echo -e "${YELLOW}Memory & Performance:${NC}"
    git config --global --get-regexp "core\.(packedGit|bigFile|preload)" || echo "  (No memory settings)"
    
    echo -e "${YELLOW}Compression & Packing:${NC}"
    git config --global --get-regexp "pack\." || echo "  (No pack settings)"
    
    echo -e "${YELLOW}File System Monitoring:${NC}"
    git config --global --get "core.fsmonitor" || echo "  (No fsmonitor)"
    git config --global --get "core.untrackedcache" || echo "  (No untracked cache)"
    
    echo -e "${YELLOW}Background Maintenance:${NC}"
    git config --global --get "maintenance.auto" || echo "  (No maintenance)"
    
    echo -e "${YELLOW}Experimental Features:${NC}"
    git config --global --get "feature.experimental" || echo "  (No experimental features)"
}

# Function to restore configuration
restore_configuration() {
    echo -e "${YELLOW}🔄 Restoring Git configuration...${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        # Restore global config
        if [ -f "$BACKUP_DIR/global-gitconfig" ]; then
            cp "$BACKUP_DIR/global-gitconfig" "$HOME/.gitconfig"
            echo -e "${GREEN}✅ Global configuration restored${NC}"
        fi
        
        # Restore local config
        if [ -f "$BACKUP_DIR/local-gitconfig" ]; then
            cp "$BACKUP_DIR/local-gitconfig" "$REPO_ROOT/.git/config"
            echo -e "${GREEN}✅ Local configuration restored${NC}"
        fi
        
        echo -e "${GREEN}✅ Configuration restored from: $BACKUP_DIR${NC}"
    else
        echo -e "${RED}❌ No backup directory found: $BACKUP_DIR${NC}"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}Advanced Git Performance Tuner${NC}"
    echo -e "${BLUE}=============================${NC}"
    echo ""
    echo -e "${YELLOW}Usage: $0 <command> [profile]${NC}"
    echo ""
    echo -e "${GREEN}Commands:${NC}"
    echo -e "  check           Check Git capabilities and features"
    echo -e "  apply <profile> Apply performance profile"
    echo -e "  monitor         Enable file system monitoring"
    echo -e "  maintenance     Enable background maintenance"
    echo -e "  optimize        Optimize repository structure"
    echo -e "  hooks           Configure performance hooks"
    echo -e "  benchmark       Benchmark current performance"
    echo -e "  config          Show current configuration"
    echo -e "  restore         Restore from backup"
    echo -e "  backup          Create configuration backup"
    echo ""
    echo -e "${GREEN}Profiles:${NC}"
    for profile in "${!PROFILES[@]}"; do
        echo -e "  $profile - ${PROFILES[$profile]}"
    done
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 apply standard"
    echo -e "  $0 apply aggressive"
    echo -e "  $0 benchmark"
    echo -e "  $0 config"
    echo ""
    echo -e "${PURPLE}Enterprise Features:${NC}"
    echo -e "  - File system monitoring with watchman"
    echo -e "  - Background maintenance scheduling"
    echo -e "  - Performance monitoring hooks"
    echo -e "  - Repository structure optimization"
}

# Main script logic
case "${1:-}" in
    "check")
        check_git_capabilities
        ;;
    "apply")
        backup_configuration
        profile="${2:-standard}"
        case "$profile" in
            "minimal")
                apply_minimal_profile
                ;;
            "standard")
                apply_standard_profile
                ;;
            "aggressive")
                apply_aggressive_profile
                ;;
            "enterprise")
                apply_enterprise_profile
                ;;
            *)
                echo -e "${RED}❌ Unknown profile: $profile${NC}"
                echo -e "${YELLOW}Available profiles: ${!PROFILES[*]}${NC}"
                exit 1
                ;;
        esac
        enable_filesystem_monitoring
        enable_background_maintenance
        configure_performance_hooks
        echo -e "${GREEN}✅ Profile '$profile' applied successfully${NC}"
        ;;
    "monitor")
        enable_filesystem_monitoring
        ;;
    "maintenance")
        enable_background_maintenance
        ;;
    "optimize")
        backup_configuration
        optimize_repository_structure
        ;;
    "hooks")
        configure_performance_hooks
        ;;
    "benchmark")
        benchmark_performance
        ;;
    "config")
        show_configuration
        ;;
    "restore")
        restore_configuration
        ;;
    "backup")
        backup_configuration
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: ${1:-}${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
