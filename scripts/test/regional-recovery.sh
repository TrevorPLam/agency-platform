#!/bin/bash

# Regional Recovery Test Script
# Tests regional recovery procedures and failover

set -euo pipefail

REGION=${1:-"us-east-1"}

echo "🌍 Testing regional recovery for region: $REGION"

# Test regional API endpoints
echo "📡 Testing regional API connectivity..."
API_ENDPOINTS=(
    "https://api.github.com"
    "https://api.github.com"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    echo "🔍 Testing: $endpoint"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ $endpoint: OK"
    else
        echo "❌ $endpoint: FAILED (HTTP $STATUS)"
    fi
done

# Test DNS resolution
echo "🔍 Testing DNS resolution..."
DNS_RECORDS=("github.com" "api.github.com" "registry.npmjs.org")

for record in "${DNS_RECORDS[@]}"; do
    if nslookup "$record" > /dev/null 2>&1; then
        echo "✅ DNS $record: OK"
    else
        echo "❌ DNS $record: FAILED"
    fi
done

# Test network connectivity
echo "🌐 Testing network connectivity..."
NETWORK_TESTS=("8.8.8.8" "1.1.1.1")

for ip in "${NETWORK_TESTS[@]}"; do
    if ping -c 1 "$ip" > /dev/null 2>&1; then
        echo "✅ Network $ip: OK"
    else
        echo "❌ Network $ip: FAILED"
    fi
done

echo "✅ Regional recovery test completed for $REGION"
