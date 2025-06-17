# PHASE 1: Foundation Setup

This phase establishes the basic Playwright testing infrastructure for the Fresco application. Each task should be completed in order.

## Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Docker installed and running
- Basic understanding of TypeScript

## Task 1.1: Initialize Playwright Configuration

**Objective**: Set up Playwright with TypeScript support and proper configuration for the Fresco application.

**Steps**:

1. **Verify Playwright is installed**:
   ```bash
   # Check if Playwright is already in package.json
   grep -A 5 -B 5 "@playwright/test" package.json
   ```
   - ✅ Playwright is already installed as version `^1.53.0`

2. **Initialize Playwright configuration**:
   ```bash
   npx playwright install
   ```

3. **Create playwright.config.ts file**:
   ```bash
   touch playwright.config.ts
   ```

4. **Add the following configuration to playwright.config.ts**:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';
   import dotenv from 'dotenv';
   
   // Load environment variables for testing
   dotenv.config({ path: '.env.test' });
   
   export default defineConfig({
     testDir: './tests/e2e',
     outputDir: './tests/e2e/test-results',
     
     // Run tests in files in parallel
     fullyParallel: true,
     
     // Fail the build on CI if you accidentally left test.only in the source code
     forbidOnly: !!process.env.CI,
     
     // Retry on CI only
     retries: process.env.CI ? 2 : 0,
     
     // Opt out of parallel tests on CI
     workers: process.env.CI ? 1 : undefined,
     
     // Reporter to use
     reporter: [
       ['html', { outputFolder: './tests/e2e/playwright-report' }],
       ['json', { outputFile: './tests/e2e/test-results.json' }],
       ['github'],
     ],
     
     // Shared settings for all the projects below
     use: {
       baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
       trace: 'on-first-retry',
       screenshot: 'only-on-failure',
       video: 'retain-on-failure',
     },
     
     // Configure projects for major browsers
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
       {
         name: 'firefox',
         use: { ...devices['Desktop Firefox'] },
       },
       {
         name: 'webkit',
         use: { ...devices['Desktop Safari'] },
       },
       {
         name: 'Mobile Chrome',
         use: { ...devices['Pixel 5'] },
       },
       {
         name: 'Mobile Safari',
         use: { ...devices['iPhone 12'] },
       },
     ],
     
     // Global setup and teardown
     globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
     globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
     
     // Run your local dev server before starting the tests
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
       timeout: 120 * 1000,
       env: {
         NODE_ENV: 'test',
       },
     },
   });
   ```

5. **Create test directory structure**:
   ```bash
   mkdir -p tests/e2e
   mkdir -p tests/e2e/fixtures
   mkdir -p tests/e2e/utils
   mkdir -p tests/e2e/page-objects
   mkdir -p tests/e2e/test-data
   ```

**Verification**: Run `npx playwright --version` to confirm Playwright is properly installed.

## Task 1.2: Environment Configuration

**Objective**: Set up test-specific environment variables and configuration.

**Steps**:

1. **Create test environment file**:
   ```bash
   touch .env.test
   ```

2. **Add test environment variables to .env.test**:
   ```env
   # Test Database Configuration
   POSTGRES_PRISMA_URL="postgresql://postgres:password@localhost:5433/fresco_test?pgbouncer=true&connect_timeout=15"
   POSTGRES_URL_NON_POOLING="postgresql://postgres:password@localhost:5433/fresco_test?connect_timeout=15"
   
   # Test Application Settings
   NODE_ENV=test
   NEXTAUTH_SECRET="test-secret-key-for-playwright-testing"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Playwright Configuration
   PLAYWRIGHT_BASE_URL="http://localhost:3000"
   
   # Skip environment validation in tests
   SKIP_ENV_VALIDATION=true
   
   # Test UploadThing Configuration (will be mocked)
   UPLOADTHING_SECRET="test-uploadthing-secret"
   UPLOADTHING_APP_ID="test-app-id"
   ```

3. **Update .gitignore to exclude test artifacts**:
   ```bash
   echo "
   # Playwright
   /tests/e2e/test-results/
   /tests/e2e/playwright-report/
   /tests/e2e/test-results.json
   " >> .gitignore
   ```

4. **Create test-specific TypeScript configuration**:
   ```bash
   touch tests/tsconfig.json
   ```

5. **Add TypeScript configuration for tests**:
   ```json
   {
     "extends": "../tsconfig.json",
     "compilerOptions": {
       "types": ["@playwright/test"],
       "baseUrl": "../",
       "paths": {
         "~/*": ["./*"],
         "@/*": ["./*"]
       }
     },
     "include": [
       "**/*.ts",
       "**/*.tsx"
     ],
     "exclude": [
       "node_modules"
     ]
   }
   ```

**Verification**: Ensure `.env.test` file exists and contains all required environment variables.

## Task 1.3: Docker Test Database Setup

**Objective**: Configure a separate PostgreSQL database container for testing.

**Steps**:

1. **Create docker-compose.test.yml file**:
   ```bash
   touch docker-compose.test.yml
   ```

2. **Add test database configuration**:
   ```yaml
   version: '3.8'
   
   services:
     postgres-test:
       image: postgres:15
       container_name: fresco-postgres-test
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
         POSTGRES_DB: fresco_test
       ports:
         - "5433:5432"
       volumes:
         - postgres_test_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 10s
         timeout: 5s
         retries: 5
   
   volumes:
     postgres_test_data:
   ```

3. **Create test database management scripts**:
   ```bash
   mkdir -p scripts/test
   touch scripts/test/setup-test-db.sh
   chmod +x scripts/test/setup-test-db.sh
   ```

4. **Add database setup script content**:
   ```bash
   #!/bin/bash
   
   echo "🚀 Setting up test database..."
   
   # Start test database container
   docker-compose -f docker-compose.test.yml up -d
   
   # Wait for database to be ready
   echo "⏳ Waiting for database to be ready..."
   until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres; do
     sleep 1
   done
   
   echo "📊 Running database migrations..."
   
   # Set test environment
   export NODE_ENV=test
   export POSTGRES_PRISMA_URL="postgresql://postgres:password@localhost:5433/fresco_test?pgbouncer=true&connect_timeout=15"
   export POSTGRES_URL_NON_POOLING="postgresql://postgres:password@localhost:5433/fresco_test?connect_timeout=15"
   
   # Run Prisma migrations
   npx prisma migrate deploy
   
   echo "✅ Test database setup complete!"
   ```

5. **Create test database teardown script**:
   ```bash
   touch scripts/test/teardown-test-db.sh
   chmod +x scripts/test/teardown-test-db.sh
   ```

6. **Add teardown script content**:
   ```bash
   #!/bin/bash
   
   echo "🧹 Cleaning up test database..."
   
   # Stop and remove test database container
   docker-compose -f docker-compose.test.yml down -v
   
   echo "✅ Test database cleanup complete!"
   ```

**Verification**: Run `./scripts/test/setup-test-db.sh` to ensure the test database starts correctly.

## Task 1.4: Global Setup and Teardown

**Objective**: Create global setup and teardown scripts for Playwright tests.

**Steps**:

1. **Create global setup file**:
   ```bash
   touch tests/e2e/global-setup.ts
   ```

2. **Add global setup content**:
   ```typescript
   import { chromium, FullConfig } from '@playwright/test';
   import { execSync } from 'child_process';
   import dotenv from 'dotenv';
   
   // Load test environment variables
   dotenv.config({ path: '.env.test' });
   
   async function globalSetup(config: FullConfig) {
     console.log('🚀 Starting global test setup...');
   
     // Setup test database
     console.log('📊 Setting up test database...');
     try {
       execSync('./scripts/test/setup-test-db.sh', { stdio: 'inherit' });
     } catch (error) {
       console.error('❌ Failed to setup test database:', error);
       throw error;
     }
   
     // Wait a bit for the database to be fully ready
     await new Promise(resolve => setTimeout(resolve, 2000));
   
     // Optional: Create a test user for authenticated tests
     console.log('👤 Creating test user...');
     try {
       // This will be implemented in Phase 3
       console.log('⏭️  Test user creation will be implemented in Phase 3');
     } catch (error) {
       console.error('⚠️  Test user creation failed (this is expected in Phase 1):', error);
     }
   
     console.log('✅ Global test setup complete!');
   }
   
   export default globalSetup;
   ```

3. **Create global teardown file**:
   ```bash
   touch tests/e2e/global-teardown.ts
   ```

4. **Add global teardown content**:
   ```typescript
   import { FullConfig } from '@playwright/test';
   import { execSync } from 'child_process';
   
   async function globalTeardown(config: FullConfig) {
     console.log('🧹 Starting global test teardown...');
   
     // Cleanup test database
     console.log('📊 Cleaning up test database...');
     try {
       execSync('./scripts/test/teardown-test-db.sh', { stdio: 'inherit' });
     } catch (error) {
       console.error('⚠️  Database cleanup failed:', error);
     }
   
     console.log('✅ Global test teardown complete!');
   }
   
   export default globalTeardown;
   ```

**Verification**: The setup and teardown scripts should be executable and not produce errors when run.

## Task 1.5: Basic Test Structure

**Objective**: Create a simple smoke test to verify the basic setup is working.

**Steps**:

1. **Create first test file**:
   ```bash
   touch tests/e2e/smoke.spec.ts
   ```

2. **Add basic smoke test**:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test.describe('Smoke Tests', () => {
     test('should load the home page', async ({ page }) => {
       await page.goto('/');
       
       // Check that the page loads and has expected content
       await expect(page).toHaveTitle(/Fresco/);
       
       // Take a screenshot for visual verification
       await page.screenshot({ path: 'tests/e2e/test-results/homepage-smoke.png' });
     });
   
     test('should have working navigation', async ({ page }) => {
       await page.goto('/');
       
       // This test will be expanded in later phases
       // For now, just verify basic page structure
       const body = page.locator('body');
       await expect(body).toBeVisible();
     });
   });
   ```

3. **Add test scripts to package.json**:
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui",
       "test:e2e:debug": "playwright test --debug",
       "test:e2e:report": "playwright show-report",
       "test:e2e:setup": "./scripts/test/setup-test-db.sh",
       "test:e2e:teardown": "./scripts/test/teardown-test-db.sh"
     }
   }
   ```

**Verification**: Run `npm run test:e2e:setup && npm run test:e2e` to ensure the basic test passes.

## Task 1.6: GitHub Actions Workflow Setup

**Objective**: Create a GitHub Actions workflow for running Playwright tests in CI.

**Steps**:

1. **Create GitHub Actions workflow file**:
   ```bash
   mkdir -p .github/workflows
   touch .github/workflows/playwright.yml
   ```

2. **Add GitHub Actions configuration**:
   ```yaml
   name: Playwright Tests
   
   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main, develop ]
   
   jobs:
     test:
       timeout-minutes: 60
       runs-on: ubuntu-latest
       
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_USER: postgres
             POSTGRES_PASSWORD: password
             POSTGRES_DB: fresco_test
           ports:
             - 5433:5432
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       
       steps:
       - uses: actions/checkout@v4
       
       - name: Setup Node.js
         uses: actions/setup-node@v4
         with:
           node-version: '22'
       
       - name: Install pnpm
         uses: pnpm/action-setup@v4
       
       - name: Get pnpm store directory
         id: pnpm-cache
         run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
       
       - name: Setup pnpm cache
         uses: actions/cache@v4
         with:
           path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
           key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
           restore-keys: |
             ${{ runner.os }}-pnpm-store-
       
       - name: Install dependencies
         run: pnpm install --frozen-lockfile
       
       - name: Install Playwright Browsers
         run: npx playwright install --with-deps
       
       - name: Setup test environment
         run: |
           cp .env.test .env
           echo "DATABASE_URL=postgresql://postgres:password@localhost:5433/fresco_test" >> .env
       
       - name: Run database migrations
         run: npx prisma migrate deploy
         env:
           POSTGRES_PRISMA_URL: postgresql://postgres:password@localhost:5433/fresco_test?pgbouncer=true&connect_timeout=15
           POSTGRES_URL_NON_POOLING: postgresql://postgres:password@localhost:5433/fresco_test?connect_timeout=15
       
       - name: Run Playwright tests
         run: npx playwright test
         env:
           CI: true
           POSTGRES_PRISMA_URL: postgresql://postgres:password@localhost:5433/fresco_test?pgbouncer=true&connect_timeout=15
           POSTGRES_URL_NON_POOLING: postgresql://postgres:password@localhost:5433/fresco_test?connect_timeout=15
           SKIP_ENV_VALIDATION: true
       
       - name: Upload Playwright Report
         uses: actions/upload-artifact@v4
         if: always()
         with:
           name: playwright-report
           path: tests/e2e/playwright-report/
           retention-days: 30
       
       - name: Upload Test Results
         uses: actions/upload-artifact@v4
         if: always()
         with:
           name: test-results
           path: tests/e2e/test-results/
           retention-days: 30
   ```

**Verification**: The workflow should be created and ready to run when code is pushed to the repository.

## Task 1.7: Documentation and README

**Objective**: Create documentation for the testing setup.

**Steps**:

1. **Create testing README**:
   ```bash
   touch tests/README.md
   ```

2. **Add comprehensive testing documentation**:
   ```markdown
   # Fresco E2E Testing Guide
   
   This directory contains end-to-end tests for the Fresco application using Playwright.
   
   ## Getting Started
   
   1. **Setup test environment**:
      \`\`\`bash
      npm run test:e2e:setup
      \`\`\`
   
   2. **Run all tests**:
      \`\`\`bash
      npm run test:e2e
      \`\`\`
   
   3. **Run tests with UI mode**:
      \`\`\`bash
      npm run test:e2e:ui
      \`\`\`
   
   4. **Debug tests**:
      \`\`\`bash
      npm run test:e2e:debug
      \`\`\`
   
   5. **View test report**:
      \`\`\`bash
      npm run test:e2e:report
      \`\`\`
   
   ## Directory Structure
   
   - \`/fixtures\` - Test fixtures and custom test configurations
   - \`/page-objects\` - Page Object Models for different pages
   - \`/test-data\` - Static test data and factories
   - \`/utils\` - Test utilities and helper functions
   
   ## Test Categories
   
   - \`smoke.spec.ts\` - Basic smoke tests
   - \`dashboard/\` - Dashboard functionality tests
   - \`setup/\` - Setup and onboarding tests
   - \`auth/\` - Authentication tests
   - \`visual/\` - Visual regression tests
   
   ## Best Practices
   
   1. Use Page Object Models for reusable page interactions
   2. Keep tests independent and isolated
   3. Use descriptive test names and organize with describe blocks
   4. Clean up test data after each test
   5. Use visual snapshots for UI regression testing
   
   ## Troubleshooting
   
   - If tests fail to connect to database, run \`npm run test:e2e:setup\`
   - If browser issues occur, run \`npx playwright install\`
   - Check test reports in \`tests/e2e/playwright-report/\`
   ```

**Verification**: Documentation should be complete and accurate.

## Phase 1 Completion Checklist

- [ ] Playwright configuration file created and properly configured
- [ ] Test environment variables set up in `.env.test`
- [ ] Test database Docker configuration created
- [ ] Database setup and teardown scripts working
- [ ] Global setup and teardown scripts created
- [ ] Basic smoke test passing
- [ ] Test scripts added to package.json
- [ ] GitHub Actions workflow configured
- [ ] Testing documentation created
- [ ] All files committed to version control

## Next Steps

After completing Phase 1, you should have:
- A working Playwright test environment
- Database setup for testing
- Basic CI/CD pipeline
- Foundation for building comprehensive tests

Proceed to **PHASE-2.md** for database seeding and test data management.