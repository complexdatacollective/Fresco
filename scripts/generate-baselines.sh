#!/bin/bash

# Script to generate baseline screenshots for visual regression tests
# Usage: ./generate-baselines.sh [test-pattern]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Visual Baseline Generator${NC}"
echo -e "This script will generate/update baseline screenshots for visual regression tests"
echo ""

# Check if playwright is available
if ! command -v npx playwright &> /dev/null; then
    echo -e "${RED}❌ Playwright not found. Please install it first.${NC}"
    exit 1
fi

# Get test pattern from command line argument or default to all visual tests
TEST_PATTERN=${1:-"**/**.spec.ts"}

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "  Test pattern: ${TEST_PATTERN}"
echo -e "  Update mode: ${GREEN}ENABLED${NC}"
echo ""

# Confirm before proceeding
read -p "Generate/update baselines? This will overwrite existing screenshots. (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚫 Cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}🚀 Starting baseline generation...${NC}"
echo ""

# Run playwright tests with update snapshots flag
echo -e "${YELLOW}📸 Generating screenshots...${NC}"
cd "$(dirname "$0")/../.."

# Run only visual snapshot tests with update flag
npx playwright test \
    --config tests/e2e/playwright.config.ts \
    --grep "visual snapshot|should match.*snapshot" \
    --update-snapshots \
    --project=dashboard \
    "${TEST_PATTERN}" \
    --reporter=line

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Baseline generation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📁 Generated baselines are stored in:${NC}"
    find tests/e2e -name "*.png" -type f | head -10 | while read -r file; do
        echo "  📄 $file"
    done
    
    total_files=$(find tests/e2e -name "*.png" -type f | wc -l)
    if [ "$total_files" -gt 10 ]; then
        echo "  ... and $((total_files - 10)) more files"
    fi
    
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "  1. Review the generated screenshots to ensure they look correct"
    echo "  2. Commit the baseline images to version control"
    echo "  3. Run regular tests to detect visual regressions"
    echo ""
    echo -e "${BLUE}🧪 To run visual regression tests:${NC}"
    echo "  pnpm playwright test --grep \"visual snapshot\""
    
else
    echo ""
    echo -e "${RED}❌ Baseline generation failed with exit code $EXIT_CODE${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Possible issues:${NC}"
    echo "  - Test environment not running"
    echo "  - Database not properly seeded"
    echo "  - Network connectivity issues"
    echo "  - Test code errors"
    echo ""
    echo -e "${BLUE}💡 Try running:${NC}"
    echo "  1. Ensure test environment is running"
    echo "  2. Check test logs for specific errors"
    echo "  3. Run individual tests with --debug flag"
fi

exit $EXIT_CODE