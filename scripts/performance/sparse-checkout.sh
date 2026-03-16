#!/bin/bash

# Sparse Checkout Configuration for Agency Platform Monorepo
# Optimized for large monorepos using Git 2.25.0+ cone mode
# Based on 2026 best practices for O(1) sparse checkout performance

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
SPARSE_CHECKOUT_FILE="$REPO_ROOT/.git/info/sparse-checkout"

# Role-based directory configurations
declare -A ROLES=(
    ["frontend"]="apps/agency-admin apps/firm apps/prospective-clients/ packages/ui packages/design-tokens packages/analytics"
    ["backend"]="packages/database packages/booking packages/email supabase/ scripts/"
    ["fullstack"]="apps/ packages/ supabase/ scripts/ docs/"
    ["client"]="apps/clients/riverside-hotel/ packages/ui packages/design-tokens packages/database"
    ["admin"]="apps/agency-admin packages/database packages/analytics packages/ui docs/"
    ["devops"]=".github/ scripts/ docs/operations/ turbo.json package.json pnpm-workspace.yaml"
    ["minimal"]="apps/agency-admin packages/ui packages/database"
)

echo -e "${BLUE}🚀 Agency Platform Sparse Checkout Configuration${NC}"
echo -e "${BLUE}=============================================${NC}"

# Function to check Git version
check_git_version() {
    local git_version=$(git --version | cut -d' ' -f3)
    local required_version="2.25.0"
    
    if ! printf '%s\n%s\n' "$required_version" "$git_version" | sort -V -C; then
        echo -e "${RED}❌ Error: Git version $git_version is too old. Required: >= $required_version${NC}"
        echo -e "${YELLOW}💡 Please upgrade Git to use sparse-checkout cone mode${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Git version $git_version supports cone mode sparse checkout${NC}"
}

# Function to initialize sparse checkout
init_sparse_checkout() {
    echo -e "${YELLOW}🔧 Initializing sparse checkout...${NC}"
    
    cd "$REPO_ROOT"
    
    # Enable sparse checkout
    git config core.sparseCheckout true
    
    # Initialize sparse checkout (creates cone mode by default in Git 2.25+)
    git sparse-checkout init --cone
    
    echo -e "${GREEN}✅ Sparse checkout initialized in cone mode${NC}"
}

# Function to set up role-based sparse checkout
setup_role_sparse_checkout() {
    local role="$1"
    
    if [[ -z "${ROLES[$role]:-}" ]]; then
        echo -e "${RED}❌ Error: Unknown role '$role'${NC}"
        echo -e "${YELLOW}💡 Available roles: ${!ROLES[*]}${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🎯 Setting up sparse checkout for role: $role${NC}"
    
    cd "$REPO_ROOT"
    
    # Convert space-separated paths to newlines for sparse-checkout set
    local paths="${ROLES[$role]}"
    local path_list=$(echo "$paths" | tr ' ' '\n')
    
    # Set sparse checkout paths
    echo "$path_list" | git sparse-checkout set --stdin
    
    echo -e "${GREEN}✅ Sparse checkout configured for role: $role${NC}"
    echo -e "${BLUE}📁 Included directories:${NC}"
    echo "$path_list" | sed 's/^/  - /'
}

# Function to show current sparse checkout status
show_status() {
    echo -e "${BLUE}📊 Sparse Checkout Status${NC}"
    echo -e "${BLUE}========================${NC}"
    
    cd "$REPO_ROOT"
    
    if ! git config --get core.sparseCheckout >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ Sparse checkout is not enabled${NC}"
        return
    fi
    
    echo -e "${GREEN}✅ Sparse checkout is enabled${NC}"
    
    # Show cone mode status
    local cone_mode=$(git config --get core.sparseCheckoutCone || echo "false")
    if [[ "$cone_mode" == "true" ]]; then
        echo -e "${GREEN}✅ Cone mode is enabled (O(1) performance)${NC}"
    else
        echo -e "${YELLOW}⚠️ Cone mode is disabled (O(N*M) performance)${NC}"
    fi
    
    # Show included directories
    echo -e "${BLUE}📁 Currently included directories:${NC}"
    if [[ -f "$SPARSE_CHECKOUT_FILE" ]]; then
        grep -v '^#' "$SPARSE_CHECKOUT_FILE" 2>/dev/null | grep -v '^$' | sed 's/^/  - /' || echo -e "${YELLOW}  (No directories configured)${NC}"
    else
        echo -e "${YELLOW}  (No sparse-checkout file found)${NC}"
    fi
    
    # Show repository size reduction
    echo -e "${BLUE}📈 Performance metrics:${NC}"
    local total_files=$(find "$REPO_ROOT" -type f ! -path '*/.git/*' | wc -l)
    local sparse_files=$(find "$REPO_ROOT" -type f ! -path '*/.git/*' -print 2>/dev/null | wc -l)
    local reduction=$(( (total_files - sparse_files) * 100 / total_files ))
    
    echo -e "${GREEN}  Total files: $total_files${NC}"
    echo -e "${GREEN}  Sparse files: $sparse_files${NC}"
    echo -e "${GREEN}  Size reduction: ${reduction}%${NC}"
}

# Function to disable sparse checkout
disable_sparse_checkout() {
    echo -e "${YELLOW}🔄 Disabling sparse checkout...${NC}"
    
    cd "$REPO_ROOT"
    
    # Restore full checkout
    git sparse-checkout disable
    
    # Disable sparse checkout config
    git config --unset core.sparseCheckout || true
    
    echo -e "${GREEN}✅ Sparse checkout disabled - full repository restored${NC}"
}

# Function to list available roles
list_roles() {
    echo -e "${BLUE}🎭 Available Roles${NC}"
    echo -e "${BLUE}=================${NC}"
    
    for role in "${!ROLES[@]}"; do
        echo -e "${GREEN}$role:${NC}"
        echo "${ROLES[$role]}" | tr ' ' '\n' | sed 's/^/    /'
        echo ""
    done
}

# Function to create custom sparse checkout
create_custom() {
    local directories="$1"
    
    if [[ -z "$directories" ]]; then
        echo -e "${RED}❌ Error: No directories specified${NC}"
        echo -e "${YELLOW}💡 Usage: $0 custom \"dir1 dir2 dir3\"${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🎨 Creating custom sparse checkout...${NC}"
    
    cd "$REPO_ROOT"
    
    # Initialize sparse checkout if not already done
    if ! git config --get core.sparseCheckout >/dev/null 2>&1; then
        init_sparse_checkout
    fi
    
    # Set custom directories
    echo "$directories" | tr ' ' '\n' | git sparse-checkout set --stdin
    
    echo -e "${GREEN}✅ Custom sparse checkout configured${NC}"
    echo -e "${BLUE}📁 Included directories:${NC}"
    echo "$directories" | tr ' ' '\n' | sed 's/^/  - /'
}

# Function to benchmark sparse checkout performance
benchmark_performance() {
    echo -e "${BLUE}⚡ Benchmarking Git Performance${NC}"
    echo -e "${BLUE}=============================${NC}"
    
    cd "$REPO_ROOT"
    
    # Benchmark git status
    echo -e "${YELLOW}📊 Testing 'git status' performance...${NC}"
    local status_time=$(time (git status >/dev/null) 2>&1 | grep real | awk '{print $2}')
    echo -e "${GREEN}  git status: $status_time${NC}"
    
    # Benchmark git log
    echo -e "${YELLOW}📊 Testing 'git log' performance...${NC}"
    local log_time=$(time (git log --oneline -10 >/dev/null) 2>&1 | grep real | awk '{print $2}')
    echo -e "${GREEN}  git log --oneline -10: $log_time${NC}"
    
    # Benchmark git checkout (only if not on main)
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        echo -e "${YELLOW}📊 Testing 'git checkout' performance...${NC}"
        local checkout_time=$(time (git checkout main >/dev/null 2>&1; git checkout "$current_branch" >/dev/null 2>&1) 2>&1 | grep real | awk '{print $2}')
        echo -e "${GREEN}  git checkout (round trip): $checkout_time${NC}"
    fi
}

# Main script logic
case "${1:-}" in
    "init")
        check_git_version
        init_sparse_checkout
        ;;
    "role")
        check_git_version
        setup_role_sparse_checkout "${2:-}"
        ;;
    "status")
        show_status
        ;;
    "disable")
        disable_sparse_checkout
        ;;
    "list")
        list_roles
        ;;
    "custom")
        check_git_version
        create_custom "${2:-}"
        ;;
    "benchmark")
        benchmark_performance
        ;;
    *)
        echo -e "${BLUE}Agency Platform Sparse Checkout Manager${NC}"
        echo -e "${BLUE}=====================================${NC}"
        echo ""
        echo -e "${YELLOW}Usage: $0 <command> [options]${NC}"
        echo ""
        echo -e "${GREEN}Commands:${NC}"
        echo -e "  init                    Initialize sparse checkout (cone mode)"
        echo -e "  role <role>             Set up role-based sparse checkout"
        echo -e "  custom \"dirs...\"        Create custom sparse checkout"
        echo -e "  status                  Show current sparse checkout status"
        echo -e "  list                    List available roles"
        echo -e "  benchmark               Benchmark Git performance"
        echo -e "  disable                 Disable sparse checkout"
        echo ""
        echo -e "${GREEN}Available roles:${NC}"
        for role in "${!ROLES[@]}"; do
            echo -e "  - $role"
        done
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo -e "  $0 init"
        echo -e "  $0 role frontend"
        echo -e "  $0 role backend"
        echo -e "  $0 custom \"apps/agency-admin packages/ui\""
        echo -e "  $0 status"
        echo -e "  $0 benchmark"
        exit 0
        ;;
esac
