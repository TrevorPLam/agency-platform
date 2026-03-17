#!/bin/bash

# GitHub API Recovery Test Script
# Tests GitHub API connectivity and recovery procedures

set -euo pipefail

echo "🔍 Testing GitHub API recovery..."

# Check if GitHub token is available
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "⚠️  GitHub token not found, using anonymous access"
    TOKEN=""
else
    TOKEN="$GITHUB_TOKEN"
fi

# Test basic API connectivity
echo "📡 Testing API connectivity..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $TOKEN" \
    "https://api.github.com/rate_limit")

if [ "$API_STATUS" = "200" ]; then
    echo "✅ GitHub API connectivity: OK"
else
    echo "❌ GitHub API connectivity: FAILED (HTTP $API_STATUS)"
    exit 1
fi

# Test repository access
echo "📂 Testing repository access..."
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
    REPO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token $TOKEN" \
        "https://api.github.com/repos/$GITHUB_REPOSITORY")
    
    if [ "$REPO_STATUS" = "200" ]; then
        echo "✅ Repository access: OK"
    else
        echo "❌ Repository access: FAILED (HTTP $REPO_STATUS)"
        exit 1
    fi
else
    echo "⚠️  GITHUB_REPOSITORY not set, skipping repository test"
fi

# Test rate limits
echo "📊 Testing rate limits..."
RATE_LIMIT=$(curl -s \
    -H "Authorization: token $TOKEN" \
    "https://api.github.com/rate_limit")

REMAINING=$(echo "$RATE_LIMIT" | jq -r '.rate.remaining')
LIMIT=$(echo "$RATE_LIMIT" | jq -r '.rate.limit')

echo "📈 Rate limit: $REMAINING/$LIMIT remaining"

if [ "$REMAINING" -lt 100 ]; then
    echo "⚠️  Low rate limit remaining"
fi

# Test webhook delivery
echo "🪝 Testing webhook delivery..."
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
    WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token $TOKEN" \
        "https://api.github.com/repos/$GITHUB_REPOSITORY/hooks")
    
    if [ "$WEBHOOK_STATUS" = "200" ]; then
        echo "✅ Webhook access: OK"
    else
        echo "⚠️  Webhook access: LIMITED (HTTP $WEBHOOK_STATUS)"
    fi
fi

echo "✅ GitHub API recovery test completed"
