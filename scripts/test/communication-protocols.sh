#!/bin/bash

# Communication Protocols Test Script
# Tests incident communication and notification systems

set -euo pipefail

DRY_RUN=${1:-"true"}

echo "📢 Testing communication protocols (dry-run: $DRY_RUN)"

# Test email notification configuration
echo "📧 Testing email notification configuration..."
if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_USER:-}" ]; then
    echo "✅ SMTP configuration found"
    echo "  Host: $SMTP_HOST"
    echo "  User: $SMTP_USER"
else
    echo "⚠️  SMTP configuration not found"
fi

# Test Slack webhook configuration
echo "💬 Testing Slack webhook configuration..."
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    echo "✅ Slack webhook configured"
    
    if [ "$DRY_RUN" = "false" ]; then
        echo "📤 Sending test notification..."
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data '{"text":"🧪 Communication protocols test - '"$(date)"'"}' \
            > /dev/null && echo "✅ Test notification sent" || echo "❌ Test notification failed"
    else
        echo "🔍 Dry-run mode - skipping notification"
    fi
else
    echo "⚠️  Slack webhook not configured"
fi

# Test PagerDuty configuration
echo "📱 Testing PagerDuty configuration..."
if [ -n "${PAGERDUTY_SERVICE_KEY:-}" ]; then
    echo "✅ PagerDuty service key configured"
else
    echo "⚠️  PagerDuty service key not configured"
fi

# Test notification templates
echo "📋 Testing notification templates..."
TEMPLATES=(
    "incident-alert"
    "recovery-complete" 
    "maintenance-scheduled"
)

for template in "${TEMPLATES[@]}"; do
    if [ -f "templates/${template}.md" ]; then
        echo "✅ Template $template: found"
    else
        echo "⚠️  Template $template: not found"
    fi
done

# Test escalation paths
echo "🔝 Testing escalation paths..."
ESCALATION_LEVELS=("level1" "level2" "level3")

for level in "${ESCALATION_LEVELS[@]}"; do
    if [ -f "escalation/${level}.json" ]; then
        echo "✅ Escalation $level: configured"
    else
        echo "⚠️  Escalation $level: not configured"
    fi
done

echo "✅ Communication protocols test completed"
