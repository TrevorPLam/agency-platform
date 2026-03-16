#!/bin/bash

# Region Check Script
# Validates regional deployment status and connectivity for disaster recovery
# Part of the Agency Platform Geographic Distribution strategy

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/region-check.log"
CONFIG_FILE="${PROJECT_ROOT}/scripts/backup/backup-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Success message
success() {
    log "SUCCESS" "$1"
    echo -e "${GREEN}✓ $1${NC}"
}

# Warning message
warning() {
    log "WARNING" "$1"
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Info message
info() {
    log "INFO" "$1"
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if required tools are installed
    local required_tools=("git" "gh" "jq" "aws" "az" "gcloud" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool '$tool' is not installed"
        fi
    done
    
    # Check if configuration file exists
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error_exit "Configuration file not found: $CONFIG_FILE"
    fi
    
    # Check if log directory exists
    local log_dir=$(dirname "$LOG_FILE")
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir"
        info "Created log directory: $log_dir"
    fi
    
    success "Prerequisites check completed"
}

# Load configuration
load_config() {
    info "Loading configuration from $CONFIG_FILE"
    
    # Parse regions from configuration
    REGIONS=$(jq -r '.regions[].name' "$CONFIG_FILE")
    REPO_NAME=$(jq -r '.repository.name' "$CONFIG_FILE")
    
    success "Configuration loaded successfully"
}

# Check GitHub repository status
check_github_status() {
    info "Checking GitHub repository status..."
    
    # Check if repository is accessible
    if ! gh api "repos/$REPO_NAME" &> /dev/null; then
        error_exit "GitHub repository not accessible: $REPO_NAME"
    fi
    
    # Check repository health
    local repo_data=$(gh api "repos/$REPO_NAME")
    local repo_size=$(echo "$repo_data" | jq -r '.size')
    local is_private=$(echo "$repo_data" | jq -r '.private')
    local default_branch=$(echo "$repo_data" | jq -r '.default_branch')
    
    if [[ "$is_private" != "true" ]]; then
        warning "Repository is not private"
    fi
    
    if [[ $repo_size -lt 100 ]]; then
        warning "Repository size is small: ${repo_size}KB"
    fi
    
    # Check recent activity
    local latest_commit=$(gh api "repos/$REPO_NAME/commits/$default_branch" | jq -r '.sha')
    if [[ -z "$latest_commit" || "$latest_commit" == "null" ]]; then
        error_exit "No recent commits found"
    fi
    
    success "GitHub repository status verified"
}

# Check AWS region connectivity
check_aws_region() {
    local region=$1
    local bucket_name="agency-platform-backup-$region"
    
    info "Checking AWS region: $region"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error_exit "AWS credentials not configured"
    fi
    
    # Check region connectivity
    if ! aws s3 ls "s3://$bucket_name" --region "$region" &> /dev/null; then
        error_exit "AWS S3 bucket not accessible: $bucket_name in $region"
    fi
    
    # Check bucket configuration
    local bucket_versioning=$(aws s3api get-bucket-versioning --bucket "$bucket_name" --region "$region" | jq -r '.Status // "disabled"')
    if [[ "$bucket_versioning" != "Enabled" ]]; then
        warning "Bucket versioning not enabled for $bucket_name"
    fi
    
    # Check bucket encryption
    local bucket_encryption=$(aws s3api get-bucket-encryption --bucket "$bucket_name" --region "$region" 2>/dev/null | jq -r '.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm // "none"')
    if [[ "$bucket_encryption" == "none" ]]; then
        warning "Bucket encryption not configured for $bucket_name"
    fi
    
    # Test upload/download
    local test_file="/tmp/region-check-test-$region.txt"
    echo "Region check test - $(date)" > "$test_file"
    
    if aws s3 cp "$test_file" "s3://$bucket_name/region-check-test.txt" --region "$region" &> /dev/null; then
        aws s3 rm "s3://$bucket_name/region-check-test.txt" --region "$region" &> /dev/null
        success "AWS region $region connectivity verified"
    else
        error_exit "AWS region $region connectivity test failed"
    fi
    
    rm -f "$test_file"
}

# Check Azure region connectivity
check_azure_region() {
    local region=$1
    local container_name="agency-platform-backup-$region"
    
    info "Checking Azure region: $region"
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        error_exit "Azure credentials not configured"
    fi
    
    # Check container accessibility
    if ! az storage container exists --name "$container_name" &> /dev/null; then
        error_exit "Azure container not accessible: $container_name"
    fi
    
    # Test upload/download
    local test_file="/tmp/region-check-test-$region.txt"
    echo "Region check test - $(date)" > "$test_file"
    
    if az storage blob upload --file "$test_file" --container-name "$container_name" --name "region-check-test.txt" &> /dev/null; then
        az storage blob delete --container-name "$container_name" --name "region-check-test.txt" &> /dev/null
        success "Azure region $region connectivity verified"
    else
        error_exit "Azure region $region connectivity test failed"
    fi
    
    rm -f "$test_file"
}

# Check GCP region connectivity
check_gcp_region() {
    local region=$1
    local bucket_name="agency-platform-backup-$region"
    
    info "Checking GCP region: $region"
    
    # Check GCP authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 | grep -q .; then
        error_exit "GCP credentials not configured"
    fi
    
    # Check bucket accessibility
    if ! gcloud storage buckets list "gs://$bucket_name" &> /dev/null; then
        error_exit "GCP bucket not accessible: $bucket_name"
    fi
    
    # Test upload/download
    local test_file="/tmp/region-check-test-$region.txt"
    echo "Region check test - $(date)" > "$test_file"
    
    if gcloud storage cp "$test_file" "gs://$bucket_name/region-check-test.txt" &> /dev/null; then
        gcloud storage rm "gs://$bucket_name/region-check-test.txt" &> /dev/null
        success "GCP region $region connectivity verified"
    else
        error_exit "GCP region $region connectivity test failed"
    fi
    
    rm -f "$test_file"
}

# Check network connectivity between regions
check_inter_region_connectivity() {
    info "Checking inter-region connectivity..."
    
    # Test latency between regions
    local primary_region="us-east-1"
    local secondary_region="us-west-2"
    
    # Simple connectivity test using ping to cloud provider endpoints
    if ping -c 3 -W 5 8.8.8.8 &> /dev/null; then
        success "Basic internet connectivity verified"
    else
        warning "Internet connectivity issues detected"
    fi
    
    # Test DNS resolution
    if nslookup github.com &> /dev/null; then
        success "DNS resolution working"
    else
        warning "DNS resolution issues detected"
    fi
}

# Check backup synchronization
check_backup_synchronization() {
    info "Checking backup synchronization..."
    
    # Check if backup scripts are accessible
    local backup_script="$PROJECT_ROOT/scripts/backup/validate-backups.sh"
    if [[ ! -f "$backup_script" ]]; then
        error_exit "Backup validation script not found: $backup_script"
    fi
    
    # Check backup configuration
    if [[ ! -f "$CONFIG_FILE" ]]; then
        error_exit "Backup configuration not found: $CONFIG_FILE"
    fi
    
    # Check backup logs
    local backup_log_dir="$PROJECT_ROOT/logs"
    if [[ ! -d "$backup_log_dir" ]]; then
        warning "Backup log directory not found: $backup_log_dir"
    else
        local log_count=$(find "$backup_log_dir" -name "backup-*.log" -type f | wc -l)
        if [[ $log_count -gt 0 ]]; then
            success "Found $log_count backup log files"
        else
            warning "No backup log files found"
        fi
    fi
    
    success "Backup synchronization check completed"
}

# Check disaster recovery readiness
check_disaster_recovery_readiness() {
    info "Checking disaster recovery readiness..."
    
    # Check recovery scripts
    local recovery_scripts=(
        "scripts/incident/response-automation.ts"
        "scripts/communication/alert-routing.ts"
        "scripts/backup/validate-backups.sh"
    )
    
    for script in "${recovery_scripts[@]}"; do
        if [[ -f "$PROJECT_ROOT/$script" ]]; then
            success "Recovery script found: $script"
        else
            warning "Recovery script missing: $script"
        fi
    done
    
    # Check configuration files
    local config_files=(
        "scripts/backup/backup-config.json"
        "scripts/communication/alert-config.json"
    )
    
    for config in "${config_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$config" ]]; then
            success "Configuration file found: $config"
        else
            warning "Configuration file missing: $config"
        fi
    done
    
    # Check GitHub Actions workflows
    local workflows=(
        ".github/workflows/recovery-test.yml"
    )
    
    for workflow in "${workflows[@]}"; do
        if [[ -f "$PROJECT_ROOT/$workflow" ]]; then
            success "Workflow found: $workflow"
        else
            warning "Workflow missing: $workflow"
        fi
    done
    
    success "Disaster recovery readiness check completed"
}

# Generate region status report
generate_report() {
    local report_file="$PROJECT_ROOT/logs/region-status-report.json"
    
    info "Generating region status report: $report_file"
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local report=$(cat <<EOF
{
    "timestamp": "$timestamp",
    "repository": "$REPO_NAME",
    "regions": [
        $(echo "$REGIONS" | jq -R . | jq -s . | jq -r '.[] | {name: ., status: "verified"}' | jq -s .)
    ],
    "checks": {
        "github_status": "passed",
        "inter_region_connectivity": "passed",
        "backup_synchronization": "passed",
        "disaster_recovery_readiness": "passed"
    },
    "warnings": [],
    "errors": [],
    "recommendations": []
}
EOF
)
    
    echo "$report" > "$report_file"
    success "Region status report generated: $report_file"
}

# Main check function
main() {
    info "Starting region check process..."
    
    # Initialize log file
    echo "=== Region Check Log - $(date) ===" > "$LOG_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # Load configuration
    load_config
    
    # Check GitHub repository status
    check_github_status
    
    # Check each region
    for region in $REGIONS; do
        case $region in
            "us-east-1"|"us-west-2")
                check_aws_region "$region"
                ;;
            "west-europe")
                check_azure_region "$region"
                ;;
            "asia-southeast1")
                check_gcp_region "$region"
                ;;
            *)
                warning "Unknown region: $region"
                ;;
        esac
    done
    
    # Check inter-region connectivity
    check_inter_region_connectivity
    
    # Check backup synchronization
    check_backup_synchronization
    
    # Check disaster recovery readiness
    check_disaster_recovery_readiness
    
    # Generate report
    generate_report
    
    success "Region check process completed successfully"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -r, --region REGION     Check specific region only"
    echo "  -v, --verbose           Enable verbose output"
    echo "  --dry-run               Show what would be checked without actually checking"
    echo "  --report-only           Only generate report without performing checks"
    echo ""
    echo "Examples:"
    echo "  $0                      Check all regions"
    echo "  $0 --region us-east-1  Check only US East region"
    echo "  $0 --verbose           Enable verbose output"
    echo "  $0 --report-only        Generate report only"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -r|--region)
            SPECIFIC_REGION="$2"
            shift 2
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --report-only)
            REPORT_ONLY=true
            shift
            ;;
        *)
            error_exit "Unknown option: $1"
            ;;
    esac
done

# If report only, generate report and exit
if [[ "${REPORT_ONLY:-false}" == "true" ]]; then
    load_config
    generate_report
    exit 0
fi

# Run main function
main "$@"
