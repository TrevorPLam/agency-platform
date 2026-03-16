#!/bin/bash

# Storage Usage Monitoring Script
# Monitors Supabase storage usage across all buckets with tenant isolation
# Provides detailed storage analytics and optimization recommendations

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONITORING_PACKAGE="$PROJECT_ROOT/packages/monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required dependencies are available
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is required but not installed"
        exit 1
    fi
    
    if [[ ! -d "$MONITORING_PACKAGE" ]]; then
        log_error "Monitoring package not found at $MONITORING_PACKAGE"
        exit 1
    fi
    
    log_success "All dependencies checked"
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables..."
    
    # Check for .env.local file
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        source "$PROJECT_ROOT/.env.local"
        log_success "Environment loaded from .env.local"
    else
        log_warning ".env.local file not found, using environment variables"
    fi
    
    # Required environment variables
    local required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment variables validated"
}

# Build monitoring package
build_monitoring_package() {
    log_info "Building monitoring package..."
    
    cd "$PROJECT_ROOT"
    
    if ! pnpm --filter @agency/monitoring build; then
        log_error "Failed to build monitoring package"
        exit 1
    fi
    
    log_success "Monitoring package built successfully"
}

# Start Supabase services (if needed)
start_supabase() {
    log_info "Starting Supabase services..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Supabase is already running
    if supabase status &> /dev/null; then
        log_info "Supabase is already running"
        return
    fi
    
    if ! supabase start; then
        log_error "Failed to start Supabase services"
        exit 1
    fi
    
    log_success "Supabase services started"
}

# Collect storage usage metrics
collect_storage_metrics() {
    local tenant_id="${1:-}"
    
    log_info "Collecting storage usage metrics..."
    
    cd "$PROJECT_ROOT"
    
    # Run storage monitoring with Node.js
    node -e "
        const { StorageMonitor } = require('./packages/monitoring/dist/index.js');
        const { getAdminClient } = require('./packages/database/dist/admin.js');
        
        async function collectMetrics() {
            try {
                const monitor = new StorageMonitor();
                const admin = getAdminClient();
                const tenantId = '$tenant_id' || 'default-tenant';
                
                log_info('Collecting storage usage for tenant: ' + tenantId);
                
                // Collect storage usage
                const usage = await monitor.collectStorageUsage();
                console.log('\\n=== Storage Usage Summary ===');
                console.log('Buckets found:', usage.length);
                
                let totalSize = 0;
                let totalFiles = 0;
                
                usage.forEach(bucket => {
                    console.log(\`\\nBucket: \${bucket.bucket}\`);
                    console.log(\`  Total Size: \${formatBytes(bucket.totalSize)}\`);
                    console.log(\`  File Count: \${bucket.fileCount}\`);
                    console.log(\`  Average File Size: \${formatBytes(bucket.averageFileSize)}\`);
                    console.log(\`  Largest File: \${formatBytes(bucket.largestFileSize)}\`);
                    
                    totalSize += bucket.totalSize;
                    totalFiles += bucket.fileCount;
                });
                
                console.log('\\n=== Overall Summary ===');
                console.log('Total Storage:', formatBytes(totalSize));
                console.log('Total Files:', totalFiles);
                console.log('Average Bucket Size:', formatBytes(totalSize / usage.length));
                
                // Convert to cost metrics
                const metrics = await monitor.convertToCostMetrics(usage, tenantId);
                console.log('\\n=== Cost Metrics ===');
                console.log('Monthly Cost:', '$' + metrics.totalCost.toFixed(2));
                console.log('Currency:', metrics.currency);
                
                // Store in database
                const { error } = await admin.from('cost_metrics').insert({
                    tenant_id: tenantId,
                    storage_usage: metrics.storageUsage,
                    cicd_runtime: metrics.cicdRuntime,
                    bandwidth_usage: metrics.bandwidthUsage,
                    total_cost: metrics.totalCost,
                    currency: metrics.currency,
                    timestamp: metrics.timestamp,
                    period: metrics.period,
                    metadata: metrics.metadata
                });
                
                if (error) {
                    console.error('Error storing metrics:', error);
                    process.exit(1);
                }
                
                console.log('\\n✅ Metrics stored successfully in database');
                
                // Identify large files
                const largeFiles = await monitor.identifyLargeFiles();
                if (largeFiles.length > 0) {
                    console.log('\\n=== Large Files (>5MB) ===');
                    largeFiles.forEach(file => {
                        console.log(\`- \${file.name} (\${file.sizeFormatted}) in \${file.bucket}\`);
                    });
                } else {
                    console.log('\\n✅ No large files found');
                }
                
                // Generate optimization recommendations
                const recommendations = await monitor.generateOptimizationRecommendations(tenantId);
                if (recommendations.length > 0) {
                    console.log('\\n=== Optimization Recommendations ===');
                    recommendations.forEach((rec, index) => {
                        console.log(\`\${index + 1}. \${rec.title}\`);
                        console.log(\`   \${rec.description}\`);
                        console.log(\`   Estimated Savings: $\${rec.estimatedSavings.toFixed(2)}/month\`);
                        console.log(\`   Priority: \${rec.priority.toUpperCase()}\`);
                        console.log(\`   Difficulty: \${rec.difficulty.toUpperCase()}\`);
                        console.log();
                    });
                } else {
                    console.log('\\n✅ No optimization recommendations at this time');
                }
                
            } catch (error) {
                console.error('Error during storage monitoring:', error);
                process.exit(1);
            }
        }
        
        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        function log_info(message) {
            console.log('[INFO] ' + message);
        }
        
        collectMetrics();
    "
}

# Check storage quotas
check_storage_quotas() {
    local tenant_id="${1:-}"
    
    log_info "Checking storage quotas..."
    
    cd "$PROJECT_ROOT"
    
    node -e "
        const { getAdminClient } = require('./packages/database/dist/admin.js');
        
        async function checkQuotas() {
            try {
                const admin = getAdminClient();
                const tenantId = '$tenant_id' || 'default-tenant';
                
                // Get current storage usage from database
                const { data: metrics, error } = await admin
                    .from('cost_metrics')
                    .select('storage_usage, timestamp')
                    .eq('tenant_id', tenantId)
                    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                    .order('timestamp', { ascending: false })
                    .limit(1);
                
                if (error) {
                    console.error('Error fetching metrics:', error);
                    process.exit(1);
                }
                
                if (!metrics || metrics.length === 0) {
                    console.log('No recent storage metrics found');
                    return;
                }
                
                const currentUsage = metrics[0].storage_usage;
                const currentUsageGB = currentUsage / (1024 * 1024 * 1024);
                
                console.log('\\n=== Storage Quota Check ===');
                console.log('Current Usage:', formatBytes(currentUsage));
                console.log('Current Usage (GB):', currentUsageGB.toFixed(2));
                
                // Define quota thresholds (these could be configurable)
                const quotas = {
                    warning: 0.8,    // 80% for warning
                    critical: 0.95,  // 95% for critical
                    limit: 100       // 100GB hard limit
                };
                
                const warningThreshold = quotas.limit * quotas.warning;
                const criticalThreshold = quotas.limit * quotas.critical;
                
                console.log('Warning Threshold (80%):', warningThreshold + ' GB');
                console.log('Critical Threshold (95%):', criticalThreshold + ' GB');
                console.log('Hard Limit:', quotas.limit + ' GB');
                
                if (currentUsageGB >= criticalThreshold) {
                    console.log('\\n🚨 CRITICAL: Storage usage exceeds critical threshold!');
                    console.log('Immediate action required. Consider cleanup or upgrade.');
                } else if (currentUsageGB >= warningThreshold) {
                    console.log('\\n⚠️  WARNING: Storage usage approaching limit');
                    console.log('Consider cleanup or optimization soon.');
                } else {
                    console.log('\\n✅ Storage usage is within acceptable limits');
                }
                
                const usagePercentage = (currentUsageGB / quotas.limit) * 100;
                console.log('Usage Percentage:', usagePercentage.toFixed(1) + '%');
                
            } catch (error) {
                console.error('Error checking quotas:', error);
                process.exit(1);
            }
        }
        
        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        checkQuotas();
    "
}

# Generate storage report
generate_storage_report() {
    local tenant_id="${1:-}"
    local days="${2:-7}"
    
    log_info "Generating storage report (last $days days)..."
    
    cd "$PROJECT_ROOT"
    
    node -e "
        const { getAdminClient } = require('./packages/database/dist/admin.js');
        
        async function generateReport() {
            try {
                const admin = getAdminClient();
                const tenantId = '$tenant_id' || 'default-tenant';
                const days = $days;
                
                console.log('=== STORAGE MONITORING REPORT ===');
                console.log('Generated at:', new Date().toISOString());
                console.log('Tenant ID:', tenantId);
                console.log('Period: Last ' + days + ' days');
                console.log();
                
                // Get cost summary
                const { data: summary } = await admin
                    .rpc('get_tenant_cost_summary', { p_tenant_id: tenantId, p_days: days });
                
                if (summary && summary.length > 0) {
                    const data = summary[0];
                    console.log('=== Cost Summary ===');
                    console.log('Total Cost:', '$' + data.total_cost.toFixed(2));
                    console.log('Storage Cost:', '$' + data.storage_cost.toFixed(2));
                    console.log('CI/CD Cost:', '$' + data.cicd_cost.toFixed(2));
                    console.log('Bandwidth Cost:', '$' + data.bandwidth_cost.toFixed(2));
                    console.log('Average Daily Cost:', '$' + data.average_daily_cost.toFixed(2));
                    console.log('Trend:', data.trend_direction + ' (' + data.trend_percentage.toFixed(1) + '%)');
                    console.log();
                }
                
                // Get recent metrics
                const { data: metrics } = await admin
                    .from('cost_metrics')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
                    .order('timestamp', { ascending: false });
                
                if (metrics && metrics.length > 0) {
                    console.log('=== Storage Metrics History ===');
                    console.log('Data Points:', metrics.length);
                    
                    let totalStorage = 0;
                    let maxStorage = 0;
                    let minStorage = Infinity;
                    
                    metrics.forEach(metric => {
                        const storageGB = metric.storage_usage / (1024 * 1024 * 1024);
                        totalStorage += storageGB;
                        maxStorage = Math.max(maxStorage, storageGB);
                        minStorage = Math.min(minStorage, storageGB);
                    });
                    
                    const avgStorage = totalStorage / metrics.length;
                    
                    console.log('Average Storage:', avgStorage.toFixed(2) + ' GB');
                    console.log('Maximum Storage:', maxStorage.toFixed(2) + ' GB');
                    console.log('Minimum Storage:', minStorage.toFixed(2) + ' GB');
                    console.log('Total Storage Cost:', '$' + metrics.reduce((sum, m) => sum + m.total_cost, 0).toFixed(2));
                    console.log();
                }
                
                // Get active alerts
                const { data: alerts } = await admin
                    .from('budget_alerts')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .eq('active', true);
                
                console.log('=== Active Budget Alerts ===');
                if (alerts && alerts.length > 0) {
                    console.log('Active Alerts:', alerts.length);
                    alerts.forEach(alert => {
                        console.log('- ' + alert.name + ' (' + alert.category + ', ' + alert.severity + ')');
                    });
                } else {
                    console.log('No active budget alerts');
                }
                console.log();
                
                // Get pending recommendations
                const { data: recommendations } = await admin
                    .from('optimization_recommendations')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .eq('status', 'pending')
                    .order('priority', { ascending: false });
                
                console.log('=== Pending Optimization Recommendations ===');
                if (recommendations && recommendations.length > 0) {
                    console.log('Pending Recommendations:', recommendations.length);
                    let totalSavings = 0;
                    recommendations.forEach(rec => {
                        console.log('- ' + rec.title + ' ($' + rec.estimated_savings.toFixed(2) + '/month, ' + rec.priority + ')');
                        totalSavings += rec.estimated_savings;
                    });
                    console.log('Total Potential Savings: $' + totalSavings.toFixed(2) + '/month');
                } else {
                    console.log('No pending optimization recommendations');
                }
                console.log();
                console.log('=== END REPORT ===');
                
            } catch (error) {
                console.error('Error generating report:', error);
                process.exit(1);
            }
        }
        
        generateReport();
    "
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    cd "$PROJECT_ROOT"
    
    # Stop Supabase if we started it
    if supabase status &> /dev/null; then
        supabase stop --no-backup
        log_info "Supabase services stopped"
    fi
}

# Main function
main() {
    local command="${1:-monitor}"
    local tenant_id="${2:-}"
    local days="${3:-7}"
    
    log_info "Starting storage monitoring script..."
    log_info "Command: $command"
    log_info "Tenant ID: ${tenant_id:-'default'}"
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Common setup
    check_dependencies
    load_environment
    build_monitoring_package
    
    case "$command" in
        "monitor")
            start_supabase
            collect_storage_metrics "$tenant_id"
            check_storage_quotas "$tenant_id"
            ;;
        "quotas")
            start_supabase
            check_storage_quotas "$tenant_id"
            ;;
        "report")
            start_supabase
            generate_storage_report "$tenant_id" "$days"
            ;;
        "metrics")
            start_supabase
            collect_storage_metrics "$tenant_id"
            ;;
        *)
            echo "Usage: $0 {monitor|quotas|report|metrics} [tenant_id] [days]"
            echo "  monitor  - Full storage monitoring with metrics and quotas"
            echo "  quotas   - Check storage quotas only"
            echo "  report   - Generate storage report (default: 7 days)"
            echo "  metrics  - Collect storage metrics only"
            echo ""
            echo "Examples:"
            echo "  $0 monitor                    # Monitor default tenant"
            echo "  $0 monitor tenant-123          # Monitor specific tenant"
            echo "  $0 report tenant-123 30        # 30-day report for tenant"
            echo "  $0 quotas                      # Check quotas for default tenant"
            exit 1
            ;;
    esac
    
    log_success "Storage monitoring completed successfully"
}

# Run main function with all arguments
main "$@"
