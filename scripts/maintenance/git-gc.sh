#!/bin/bash

# Git Garbage Collection Script
# Safe garbage collection with rollback capabilities
# Designed for Agency Platform monorepo

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
BACKUP_DIR="$REPO_ROOT/.git-gc-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$REPO_ROOT/.git-gc.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Git Garbage Collection Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --aggressive     Run aggressive garbage collection (slower, more thorough)
    --dry-run        Show what would be done without executing
    --backup-dir DIR Specify custom backup directory
    --prune DATE     Prune objects older than DATE (default: 2.weeks.ago)
    --help           Show this help message

EXAMPLES:
    $0                           # Standard garbage collection
    $0 --aggressive              # Aggressive garbage collection
    $0 --dry-run                 # Preview what would be done
    $0 --prune 1.month.ago       # Keep objects for 1 month

EOF
}

# Parse arguments
AGGRESSIVE=false
DRY_RUN=false
PRUNE_DATE="2.weeks.ago"
CUSTOM_BACKUP=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --aggressive)
            AGGRESSIVE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --backup-dir)
            CUSTOM_BACKUP="$2"
            shift 2
            ;;
        --prune)
            PRUNE_DATE="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Set backup directory
if [ -n "$CUSTOM_BACKUP" ]; then
    BACKUP_DIR="$CUSTOM_BACKUP"
fi

# Validate we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a Git repository"
fi

log "Starting Git garbage collection..."
log "Repository: $REPO_ROOT"
log "Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Pre-GC analysis
log "📊 Pre-GC repository analysis..."

# Repository size
REPO_SIZE=$(du -sh "$REPO_ROOT/.git" | cut -f1)
log "Repository size: $REPO_SIZE"

# Object counts
OBJECT_STATS=$(git count-objects -v)
LOOSE_OBJECTS=$(echo "$OBJECT_STATS" | grep 'loose' | cut -d: -f2 | tr -d ' ')
PACK_OBJECTS=$(echo "$OBJECT_STATS" | grep 'in-pack' | cut -d: -f2 | tr -d ' ')
log "Loose objects: $LOOSE_OBJECTS"
log "Packed objects: $PACK_OBJECTS"

# Pack files
PACK_COUNT=$(ls "$REPO_ROOT/.git/objects/pack"/*.pack 2>/dev/null | wc -l)
log "Pack files: $PACK_COUNT"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    error "Repository has uncommitted changes. Commit or stash before running GC."
fi

# Check for ongoing operations
if [ -f "$REPO_ROOT/.git/index.lock" ] || [ -f "$REPO_ROOT/.git/HEAD.lock" ]; then
    error "Git appears to be locked. Another operation may be in progress."
fi

# Backup critical Git files
log "📦 Creating backup..."

CRITICAL_FILES=(
    ".git/HEAD"
    ".git/refs"
    ".git/objects/pack"
    ".git/info"
)

for file in "${CRITICAL_FILES[@]}"; do
    src="$REPO_ROOT/$file"
    dst="$BACKUP_DIR/$file"
    
    if [ -e "$src" ]; then
        mkdir -p "$(dirname "$dst")"
        cp -r "$src" "$dst"
        log "Backed up: $file"
    fi
done

# Store current state for rollback
cat > "$BACKUP_DIR/gc-state.txt" << EOF
Original repository size: $REPO_SIZE
Loose objects: $LOOSE_OBJECTS
Packed objects: $PACK_OBJECTS
Pack files: $PACK_COUNT
Prune date: $PRUNE_DATE
Aggressive: $AGGRESSIVE
Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
EOF

# Dry run mode
if [ "$DRY_RUN" = true ]; then
    log "🔍 DRY RUN MODE - No changes will be made"
    
    GC_CMD="git gc --prune=$PRUNE_DATE"
    if [ "$AGGRESSIVE" = true ]; then
        GC_CMD="$GC_CMD --aggressive"
    fi
    
    log "Would execute: $GC_CMD"
    log "Would clean up loose objects"
    log "Would repack objects"
    
    success "Dry run completed. No changes made."
    exit 0
fi

# Execute garbage collection
log "🧹 Executing garbage collection..."

# Build GC command
GC_CMD="git gc --prune=$PRUNE_DATE"

if [ "$AGGRESSIVE" = true ]; then
    log "Running aggressive garbage collection (this may take a while)..."
    GC_CMD="$GC_CMD --aggressive"
    
    # For aggressive mode, add more optimization flags
    GC_CMD="$GC_CMD --window=250 --depth=250"
else
    log "Running standard garbage collection..."
fi

# Execute GC with error handling
log "Command: $GC_CMD"

if ! eval "$GC_CMD" 2>&1 | tee -a "$LOG_FILE"; then
    error "Garbage collection failed"
fi

# Additional cleanup for large repositories
log "🧹 Additional cleanup..."

# Prune remote tracking branches
log "Pruning stale remote tracking branches..."
git remote prune origin 2>&1 | tee -a "$LOG_FILE" || warning "Failed to prune remote branches"

# Clean up reflog
log "Cleaning up reflog..."
git reflog expire --expire=$PRUNE_DATE --all 2>&1 | tee -a "$LOG_FILE" || warning "Failed to clean reflog"

# Post-GC analysis
log "📊 Post-GC repository analysis..."

POST_REPO_SIZE=$(du -sh "$REPO_ROOT/.git" | cut -f1)
POST_OBJECT_STATS=$(git count-objects -v)
POST_LOOSE_OBJECTS=$(echo "$POST_OBJECT_STATS" | grep 'loose' | cut -d: -f2 | tr -d ' ')
POST_PACK_OBJECTS=$(echo "$POST_OBJECT_STATS" | grep 'in-pack' | cut -d: -f2 | tr -d ' ')
POST_PACK_COUNT=$(ls "$REPO_ROOT/.git/objects/pack"/*.pack 2>/dev/null | wc -l)

log "Post-GC repository size: $POST_REPO_SIZE"
log "Post-GC loose objects: $POST_LOOSE_OBJECTS"
log "Post-GC packed objects: $POST_PACK_OBJECTS"
log "Post-GC pack files: $POST_PACK_COUNT"

# Calculate improvements
if command -v numfmt >/dev/null 2>&1; then
    SIZE_BYTES_BEFORE=$(du -sb "$REPO_ROOT/.git" | cut -f1)
    SIZE_BYTES_AFTER=$(du -sb "$REPO_ROOT/.git" | cut -f1)
    SIZE_SAVED=$((SIZE_BYTES_BEFORE - SIZE_BYTES_AFTER))
    SIZE_SAVED_HUMAN=$(numfmt --to=iec-i --suffix=B $SIZE_SAVED)
    
    log "Space saved: $SIZE_SAVED_HUMAN"
fi

# Repository integrity check
log "🔍 Verifying repository integrity..."

if ! git fsck --no-dangling > /dev/null 2>&1; then
    error "Repository integrity check failed after GC"
fi

success "Repository integrity verified"

# Performance test
log "⚡ Performance testing..."

STATUS_TIME=$(time (git status >/dev/null) 2>&1 | grep real | awk '{print $2}')
LOG_TIME=$(time (git log --oneline -10 >/dev/null) 2>&1 | grep real | awk '{print $2}')

log "git status time: $STATUS_TIME"
log "git log (10) time: $LOG_TIME"

# Generate summary
cat << EOF

🎉 Garbage Collection Completed Successfully!

## Summary
- **Original Size:** $REPO_SIZE
- **Final Size:** $POST_REPO_SIZE
- **Loose Objects:** $LOOSE_OBJECTS → $POST_LOOSE_OBJECTS
- **Pack Files:** $PACK_COUNT → $POST_PACK_COUNT
- **Space Saved:** ${SIZE_SAVED_HUMAN:-"N/A"}

## Performance
- **git status:** $STATUS_TIME
- **git log (10):** $LOG_TIME

## Backup Information
- **Backup Location:** $BACKUP_DIR
- **Log File:** $LOG_FILE

## Rollback (if needed)
If you experience issues, restore from backup:
\`\`\`bash
# Restore critical files
cp -r "$BACKUP_DIR/.git"/* "$REPO_ROOT/.git/"
\`\`\`

## Next Steps
1. Test Git operations to ensure everything works correctly
2. Monitor repository performance over the next few days
3. Consider running aggressive GC monthly for large repositories

EOF

success "Garbage collection completed successfully!"

# Cleanup old backups (keep last 5)
log "🧹 Cleaning up old backups..."

OLD_BACKUPS=$(ls -d "$REPO_ROOT/.git-gc-backup-"* 2>/dev/null | sort -r | tail -n +6)

for backup in $OLD_BACKUPS; do
    log "Removing old backup: $backup"
    rm -rf "$backup"
done

log "Maintenance completed!"
