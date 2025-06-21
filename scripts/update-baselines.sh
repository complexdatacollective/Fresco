#!/bin/bash
# scripts/visual/update-baselines.sh

set -e

echo "🖼️  Updating visual test baselines..."

# Parse command line arguments
TEST_PATTERN=""
BROWSER="chromium"

while [[ $# -gt 0 ]]; do
  case $1 in
    --pattern)
      TEST_PATTERN="$2"
      shift 2
      ;;
    --browser)
      BROWSER="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--pattern <test-pattern>] [--browser <browser>]"
      echo "  --pattern: Test file pattern (e.g., '**/dashboard/*.visual.spec.ts')"
      echo "  --browser: Browser to use (chromium, firefox, webkit)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set default pattern if not provided
if [ -z "$TEST_PATTERN" ]; then
  TEST_PATTERN="/visual.spec.ts/"
fi

echo "📋 Pattern: $TEST_PATTERN"
echo "🌐 Browser: $BROWSER"

# Update snapshots
echo "📸 Updating screenshots..."
pnpm exec playwright test "$TEST_PATTERN" --project="$BROWSER-visual" --update-snapshots

# Show results
echo "✅ Visual baselines updated successfully!"
echo "📊 Review changes with: git diff"
echo "🎭 Open test report with: npx playwright show-report"