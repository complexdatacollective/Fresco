#!/bin/bash
# scripts/visual/validate-setup.sh

set -e

echo "🔍 Validating visual test setup..."

# Check Playwright installation
if ! command -v npx &> /dev/null; then
  echo "❌ npx not found - please install Node.js"
  exit 1
fi

# Check Playwright
if ! npx playwright --version &> /dev/null; then
  echo "❌ Playwright not installed"
  echo "💡 Run: npx playwright install"
  exit 1
fi

# Check browsers
echo "🌐 Checking browser installations..."
npx playwright install --with-deps

# Check configuration
if [ ! -f "playwright.config.ts" ]; then
  echo "❌ Playwright configuration not found"
  exit 1
fi

# Check visual test utilities
if [ ! -d "tests/e2e/utils/visual" ]; then
  echo "❌ Visual test utilities not found"
  exit 1
fi

# Check test database
echo "📊 Checking test database..."
npm run test:e2e:setup

# Run a simple visual test
echo "🧪 Running validation test..."
npx playwright test tests/e2e/smoke.spec.ts --project=chromium-visual || echo "⚠️  Basic test failed"

echo "✅ Visual test setup validation complete!"