#!/bin/bash

# Documentation Link Check Script
# This script checks all markdown files for broken links

set -e

echo "🔗 Starting documentation link check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all markdown files (excluding node_modules and .git)
echo "📋 Finding markdown files..."
MARKDOWN_FILES=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -not -path "./dist/*")

if [ -z "$MARKDOWN_FILES" ]; then
    echo -e "${YELLOW}⚠️  No markdown files found${NC}"
    exit 0
fi

FILE_COUNT=$(echo "$MARKDOWN_FILES" | wc -l)
echo "📄 Found $FILE_COUNT markdown files to check"

# Check if markdown-link-check is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please ensure Node.js is installed.${NC}"
    exit 1
fi

# Check if config file exists
if [ ! -f ".markdownlinkcheck.json" ]; then
    echo -e "${RED}❌ .markdownlinkcheck.json config file not found${NC}"
    exit 1
fi

# Run link check on each file
FAILED_FILES=0
TOTAL_CHECKS=0

for file in $MARKDOWN_FILES; do
    echo "🔍 Checking $file..."
    
    if npx markdown-link-check --config .markdownlinkcheck.json "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
        FAILED_FILES=$((FAILED_FILES + 1))
        
        # Show details for failed files
        echo "📋 Broken links in $file:"
        npx markdown-link-check --config .markdownlinkcheck.json "$file" 2>&1 | grep "✖" || true
    fi
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Summary
echo ""
echo "📊 Link Check Summary:"
echo "======================"
echo "Total files checked: $TOTAL_CHECKS"
echo "Files with broken links: $FAILED_FILES"

if [ $FAILED_FILES -eq 0 ]; then
    echo -e "${GREEN}🎉 All links are valid!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found broken links in $FAILED_FILES files${NC}"
    echo ""
    echo "💡 To fix broken links:"
    echo "   1. Review the failed files listed above"
    echo "   2. Update or remove broken links"
    echo "   3. Run this script again to verify fixes"
    echo ""
    echo "🔧 To ignore specific links, update .markdownlinkcheck.json"
    exit 1
fi
