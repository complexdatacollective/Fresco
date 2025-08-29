#!/bin/bash

# Setup script for E2E tests
set -e

echo "🎭 Setting up Playwright E2E tests for Fresco"

# Install Playwright browsers
echo "📦 Installing Playwright browsers..."
pnpm exec playwright install

# Create necessary directories
echo "📁 Creating test directories..."
mkdir -p tests/e2e/.auth
mkdir -p test-results/screenshots
mkdir -p playwright-report

# Create .gitignore for test artifacts if it doesn't exist
if [ ! -f tests/e2e/.gitignore ]; then
  echo "📝 Creating test .gitignore..."
  cat > tests/e2e/.gitignore << EOF
# Test artifacts
.auth/
test-results/
playwright-report/

# Screenshots (keep baselines in git, exclude generated ones)
*.png-actual
*.png-diff
EOF
fi

# Check if test database is configured
echo "🗄️ Checking test database configuration..."
if [ ! -f .env.test ]; then
  echo "❌ .env.test file not found. Please ensure test environment is configured."
  exit 1
fi

# Validate configuration
echo "🔍 Validating Playwright configuration..."
pnpm exec playwright test --list > /dev/null && echo "✅ Configuration valid" || {
  echo "❌ Configuration invalid. Check playwright.config.ts"
  exit 1
}

echo "✨ E2E test setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your development server is running: pnpm dev"
echo "2. Run smoke tests: pnpm test:e2e:smoke"
echo "3. Generate visual baselines: pnpm test:visual:update"
echo "4. Run all dashboard tests: pnpm test:e2e:dashboard"
echo ""
echo "For interactive debugging: pnpm test:e2e:ui"