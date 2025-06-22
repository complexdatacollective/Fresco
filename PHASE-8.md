# PHASE 8: CI/CD Integration & Optimization

This phase implements continuous integration, test automation, performance optimization, and maintenance strategies for the comprehensive Playwright testing suite.

## Prerequisites

- Phase 1-7 completed successfully
- Understanding of GitHub Actions workflows
- Knowledge of CI/CD best practices for testing
- Familiarity with test performance optimization

## Task 8.1: GitHub Actions CI/CD Pipeline Enhancement

**Objective**: Enhance the existing GitHub Actions workflow to run Playwright tests efficiently with proper artifact management and parallel execution.

**Steps**:

1. **Update the main CI workflow**:

   ```bash
   # Update .github/workflows/ci.yml
   ```

2. **Enhanced CI workflow configuration**:

   ```yaml
   # .github/workflows/ci.yml - Enhanced version
   name: CI

   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main]

   jobs:
     test-setup:
       runs-on: ubuntu-latest
       outputs:
         matrix: ${{ steps.set-matrix.outputs.matrix }}
       steps:
         - uses: actions/checkout@v4
         - name: Set test matrix
           id: set-matrix
           run: |
             echo "matrix=$(cat .github/test-matrix.json)" >> $GITHUB_OUTPUT

     unit-tests:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v2
           with:
             version: 9.1.1
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install --frozen-lockfile

         - name: Run unit tests
           run: pnpm test

         - name: Upload coverage reports
           uses: codecov/codecov-action@v3
           if: success()

     e2e-tests:
       needs: [test-setup, unit-tests]
       runs-on: ubuntu-latest
       strategy:
         fail-fast: false
         matrix:
           project: [chromium, firefox, webkit]
           shard: [1, 2, 3, 4]
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: fresco_test
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
           ports:
             - 5432:5432

       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v2
           with:
             version: 9.1.1
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install --frozen-lockfile

         - name: Install Playwright browsers
           run: pnpm exec playwright install --with-deps ${{ matrix.project }}

         - name: Setup test environment
           run: |
             cp .env.example .env.test
             echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fresco_test" >> .env.test
             echo "NEXTAUTH_SECRET=test-secret-key-for-ci" >> .env.test
             echo "UPLOADTHING_SECRET=test-uploadthing-secret" >> .env.test

         - name: Run database migrations
           run: pnpm exec prisma migrate deploy
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fresco_test

         - name: Build application
           run: pnpm build

         - name: Run Playwright tests
           run: pnpm exec playwright test --project=${{ matrix.project }} --shard=${{ matrix.shard }}/4
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fresco_test

         - name: Upload test results
           uses: actions/upload-artifact@v4
           if: always()
           with:
             name: playwright-results-${{ matrix.project }}-${{ matrix.shard }}
             path: |
               test-results/
               playwright-report/
             retention-days: 7

         - name: Upload screenshots on failure
           uses: actions/upload-artifact@v4
           if: failure()
           with:
             name: screenshots-${{ matrix.project }}-${{ matrix.shard }}
             path: test-results/
             retention-days: 30

     visual-regression:
       needs: unit-tests
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: fresco_test
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
           ports:
             - 5432:5432

       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0 # Need full history for baseline comparison

         - uses: pnpm/action-setup@v2
           with:
             version: 9.1.1
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install --frozen-lockfile

         - name: Install Playwright browsers
           run: pnpm exec playwright install --with-deps chromium

         - name: Setup test environment
           run: |
             cp .env.example .env.test
             echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fresco_test" >> .env.test

         - name: Run database migrations
           run: pnpm exec prisma migrate deploy
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fresco_test

         - name: Build application
           run: pnpm build

         - name: Run visual regression tests
           run: pnpm exec playwright test --config=playwright.visual.config.ts
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/fresco_test

         - name: Upload visual test results
           uses: actions/upload-artifact@v4
           if: always()
           with:
             name: visual-test-results
             path: |
               test-results/
               visual-report/
             retention-days: 14

     test-report:
       needs: [e2e-tests, visual-regression]
       runs-on: ubuntu-latest
       if: always()
       steps:
         - uses: actions/checkout@v4
         - name: Download all artifacts
           uses: actions/download-artifact@v4

         - name: Generate combined test report
           run: |
             mkdir -p combined-report
             # Combine all test results into a single report
             # This step would involve custom reporting logic

         - name: Upload combined report
           uses: actions/upload-artifact@v4
           with:
             name: combined-test-report
             path: combined-report/
             retention-days: 30
   ```

3. **Create test matrix configuration**:

   ```bash
   mkdir -p .github
   touch .github/test-matrix.json
   ```

4. **Add test matrix configuration**:

   ```json
   {
     "browsers": ["chromium", "firefox", "webkit"],
     "shards": [1, 2, 3, 4],
     "environments": ["desktop", "mobile"]
   }
   ```

## Task 8.2: Performance Optimization & Parallel Testing

**Objective**: Optimize test execution speed and implement efficient parallel testing strategies.

**Steps**:

1. **Create performance optimization utilities**:

   ```bash
   mkdir -p tests/e2e/utils/performance
   touch tests/e2e/utils/performance/index.ts
   ```

2. **Add performance optimization utilities**:

   ```typescript
   // tests/e2e/utils/performance/index.ts
   import { Page, TestInfo } from '@playwright/test';

   export interface PerformanceConfig {
     enableMetrics: boolean;
     enableTracing: boolean;
     slowTestThreshold: number;
     networkIdleTimeout: number;
   }

   export class PerformanceOptimizer {
     private config: PerformanceConfig;

     constructor(config: Partial<PerformanceConfig> = {}) {
       this.config = {
         enableMetrics: true,
         enableTracing: false,
         slowTestThreshold: 30000, // 30 seconds
         networkIdleTimeout: 2000,
         ...config,
       };
     }

     /**
      * Start performance monitoring for a test
      */
     async startMonitoring(page: Page, testInfo: TestInfo) {
       if (this.config.enableMetrics) {
         await page.addInitScript(() => {
           // Add performance monitoring code
           window.performance.clearResourceTimings();
           window.performance.clearMeasures();
           window.performance.clearMarks();
         });
       }

       if (this.config.enableTracing) {
         await page.context().tracing.start({
           screenshots: true,
           snapshots: true,
           sources: true,
         });
       }
     }

     /**
      * Stop monitoring and collect performance data
      */
     async stopMonitoring(page: Page, testInfo: TestInfo) {
       const performanceData: any = {};

       if (this.config.enableMetrics) {
         performanceData.metrics = await page.evaluate(() => {
           const navigation = performance.getEntriesByType(
             'navigation',
           )[0] as PerformanceNavigationTiming;
           const paint = performance.getEntriesByType('paint');

           return {
             domContentLoaded:
               navigation.domContentLoadedEventEnd -
               navigation.domContentLoadedEventStart,
             loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
             firstPaint:
               paint.find((p) => p.name === 'first-paint')?.startTime || 0,
             firstContentfulPaint:
               paint.find((p) => p.name === 'first-contentful-paint')
                 ?.startTime || 0,
             resources: performance.getEntriesByType('resource').length,
           };
         });
       }

       if (this.config.enableTracing) {
         const tracePath = `test-results/${testInfo.title.replace(/\s+/g, '-')}-trace.zip`;
         await page.context().tracing.stop({ path: tracePath });
         performanceData.tracePath = tracePath;
       }

       // Log slow tests
       const testDuration = Date.now() - testInfo.startTime.getTime();
       if (testDuration > this.config.slowTestThreshold) {
         console.warn(
           `Slow test detected: ${testInfo.title} took ${testDuration}ms`,
         );
       }

       return performanceData;
     }

     /**
      * Optimize page loading performance
      */
     async optimizePageLoad(page: Page) {
       // Block unnecessary resources for faster testing
       await page.route('**/*', (route) => {
         const url = route.request().url();
         const resourceType = route.request().resourceType();

         // Block non-essential resources
         if (resourceType === 'image' && !url.includes('essential')) {
           route.abort();
         } else if (resourceType === 'font' && !url.includes('critical')) {
           route.abort();
         } else if (resourceType === 'media') {
           route.abort();
         } else {
           route.continue();
         }
       });
     }

     /**
      * Wait for network to be idle with custom timeout
      */
     async waitForNetworkIdle(page: Page) {
       await page.waitForLoadState('networkidle', {
         timeout: this.config.networkIdleTimeout,
       });
     }
   }
   ```

3. **Create parallel test configuration**:

   ```bash
   touch tests/e2e/utils/performance/parallel.ts
   ```

4. **Add parallel test utilities**:

   ```typescript
   // tests/e2e/utils/performance/parallel.ts
   import { TestInfo } from '@playwright/test';

   export interface ParallelTestConfig {
     maxWorkers: number;
     shardIndex: number;
     shardTotal: number;
     testGrouping: 'file' | 'suite' | 'test';
   }

   export class ParallelTestManager {
     private config: ParallelTestConfig;

     constructor(config: Partial<ParallelTestConfig> = {}) {
       this.config = {
         maxWorkers: 4,
         shardIndex: 0,
         shardTotal: 1,
         testGrouping: 'file',
         ...config,
       };
     }

     /**
      * Determine if a test should run in current shard
      */
     shouldRunTest(testInfo: TestInfo): boolean {
       if (this.config.shardTotal <= 1) return true;

       const testId = this.getTestId(testInfo);
       const hash = this.simpleHash(testId);
       const shard = hash % this.config.shardTotal;

       return shard === this.config.shardIndex;
     }

     /**
      * Get unique test identifier based on grouping strategy
      */
     private getTestId(testInfo: TestInfo): string {
       switch (this.config.testGrouping) {
         case 'file':
           return testInfo.file;
         case 'suite':
           return `${testInfo.file}:${testInfo.titlePath[0] || ''}`;
         case 'test':
           return `${testInfo.file}:${testInfo.titlePath.join('>')}`;
         default:
           return testInfo.file;
       }
     }

     /**
      * Simple hash function for consistent test distribution
      */
     private simpleHash(str: string): number {
       let hash = 0;
       for (let i = 0; i < str.length; i++) {
         const char = str.charCodeAt(i);
         hash = (hash << 5) - hash + char;
         hash = hash & hash; // Convert to 32-bit integer
       }
       return Math.abs(hash);
     }

     /**
      * Get worker pool configuration
      */
     getWorkerConfig() {
       return {
         workers: this.config.maxWorkers,
         retries: process.env.CI ? 2 : 0,
         timeout: 30000,
         expect: {
           timeout: 10000,
         },
       };
     }
   }
   ```

## Task 8.3: Test Monitoring & Reporting

**Objective**: Implement comprehensive test monitoring, reporting, and alerting systems.

**Steps**:

1. **Create monitoring utilities**:

   ```bash
   mkdir -p tests/e2e/utils/monitoring
   touch tests/e2e/utils/monitoring/index.ts
   ```

2. **Add test monitoring implementation**:

   ```typescript
   // tests/e2e/utils/monitoring/index.ts
   import { TestResult, TestCase } from '@playwright/test/reporter';
   import { writeFileSync, existsSync, mkdirSync } from 'fs';
   import { join } from 'path';

   export interface TestMetrics {
     totalTests: number;
     passedTests: number;
     failedTests: number;
     skippedTests: number;
     duration: number;
     slowTests: TestCase[];
     flakiness: Map<string, number>;
   }

   export class TestMonitor {
     private metrics: TestMetrics;
     private reportPath: string;

     constructor(reportPath: string = 'test-results/monitoring') {
       this.reportPath = reportPath;
       this.metrics = {
         totalTests: 0,
         passedTests: 0,
         failedTests: 0,
         skippedTests: 0,
         duration: 0,
         slowTests: [],
         flakiness: new Map(),
       };

       this.ensureReportDirectory();
     }

     private ensureReportDirectory() {
       if (!existsSync(this.reportPath)) {
         mkdirSync(this.reportPath, { recursive: true });
       }
     }

     /**
      * Record test results
      */
     recordTestResult(test: TestCase, result: TestResult) {
       this.metrics.totalTests++;
       this.metrics.duration += result.duration;

       switch (result.status) {
         case 'passed':
           this.metrics.passedTests++;
           break;
         case 'failed':
           this.metrics.failedTests++;
           this.trackFlakiness(test);
           break;
         case 'skipped':
           this.metrics.skippedTests++;
           break;
       }

       // Track slow tests (>10 seconds)
       if (result.duration > 10000) {
         this.metrics.slowTests.push(test);
       }
     }

     /**
      * Track test flakiness
      */
     private trackFlakiness(test: TestCase) {
       const testId = `${test.location?.file}:${test.title}`;
       const current = this.metrics.flakiness.get(testId) || 0;
       this.metrics.flakiness.set(testId, current + 1);
     }

     /**
      * Generate comprehensive test report
      */
     generateReport() {
       const report = {
         timestamp: new Date().toISOString(),
         summary: {
           total: this.metrics.totalTests,
           passed: this.metrics.passedTests,
           failed: this.metrics.failedTests,
           skipped: this.metrics.skippedTests,
           passRate:
             this.metrics.totalTests > 0
               ? (
                   (this.metrics.passedTests / this.metrics.totalTests) *
                   100
                 ).toFixed(2)
               : '0',
           totalDuration: this.metrics.duration,
           averageDuration:
             this.metrics.totalTests > 0
               ? (this.metrics.duration / this.metrics.totalTests).toFixed(2)
               : '0',
         },
         performance: {
           slowTests: this.metrics.slowTests.map((test) => ({
             title: test.title,
             file: test.location?.file,
             line: test.location?.line,
           })),
         },
         flakiness: Array.from(this.metrics.flakiness.entries()).map(
           ([test, count]) => ({
             test,
             failures: count,
             flakinessRate: ((count / this.metrics.totalTests) * 100).toFixed(
               2,
             ),
           }),
         ),
       };

       // Write JSON report
       const jsonPath = join(this.reportPath, 'test-metrics.json');
       writeFileSync(jsonPath, JSON.stringify(report, null, 2));

       // Write HTML report
       this.generateHtmlReport(report);

       return report;
     }

     /**
      * Generate HTML report
      */
     private generateHtmlReport(report: any) {
       const html = `
       <!DOCTYPE html>
       <html>
       <head>
         <title>Test Monitoring Report</title>
         <style>
           body { font-family: Arial, sans-serif; margin: 40px; }
           .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
           .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
           .passed { color: #28a745; }
           .failed { color: #dc3545; }
           .skipped { color: #ffc107; }
           table { width: 100%; border-collapse: collapse; margin: 20px 0; }
           th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
           th { background-color: #f2f2f2; }
         </style>
       </head>
       <body>
         <h1>Test Monitoring Report</h1>
         <p>Generated: ${report.timestamp}</p>
         
         <div class="summary">
           <h2>Test Summary</h2>
           <div class="metric">Total Tests: <strong>${report.summary.total}</strong></div>
           <div class="metric passed">Passed: <strong>${report.summary.passed}</strong></div>
           <div class="metric failed">Failed: <strong>${report.summary.failed}</strong></div>
           <div class="metric skipped">Skipped: <strong>${report.summary.skipped}</strong></div>
           <div class="metric">Pass Rate: <strong>${report.summary.passRate}%</strong></div>
           <div class="metric">Total Duration: <strong>${(report.summary.totalDuration / 1000).toFixed(2)}s</strong></div>
         </div>
   
         ${
           report.performance.slowTests.length > 0
             ? `
      <h2>Slow Tests (>10s)</h2>
      <table>
        <tr><th>Test</th><th>File</th></tr>
        ${report.performance.slowTests
          .map(
            (test: any) => `
          <tr><td>${test.title}</td><td>${test.file}:${test.line}</td></tr>
        `,
          )
          .join('')}
      </table>
      `
             : ''
         }
   
         ${
           report.flakiness.length > 0
             ? `
      <h2>Flaky Tests</h2>
      <table>
        <tr><th>Test</th><th>Failures</th><th>Flakiness Rate</th></tr>
        ${report.flakiness
          .map(
            (flaky: any) => `
          <tr><td>${flaky.test}</td><td>${flaky.failures}</td><td>${flaky.flakinessRate}%</td></tr>
        `,
          )
          .join('')}
      </table>
      `
             : ''
         }
       </body>
       </html>`;

       const htmlPath = join(this.reportPath, 'test-report.html');
       writeFileSync(htmlPath, html);
     }

     /**
      * Check if alerts should be sent
      */
     shouldAlert(): boolean {
       const passRate =
         this.metrics.totalTests > 0
           ? this.metrics.passedTests / this.metrics.totalTests
           : 0;

       // Alert if pass rate below 95% or more than 5 flaky tests
       return passRate < 0.95 || this.metrics.flakiness.size > 5;
     }
   }
   ```

## Task 8.4: Maintenance & Cleanup Scripts

**Objective**: Create automated maintenance scripts for test data cleanup, artifact management, and health monitoring.

**Steps**:

1. **Create maintenance scripts directory**:

   ```bash
   mkdir -p scripts/test-maintenance
   touch scripts/test-maintenance/cleanup.ts
   ```

2. **Add cleanup script**:

   ```typescript
   // scripts/test-maintenance/cleanup.ts
   import { rmSync, existsSync, readdirSync, statSync } from 'fs';
   import { join } from 'path';
   import { prisma } from '../tests/e2e/utils/database/client';

   interface CleanupConfig {
     retentionDays: number;
     cleanupPaths: string[];
     cleanupDatabase: boolean;
   }

   class TestCleanup {
     private config: CleanupConfig;

     constructor(config: Partial<CleanupConfig> = {}) {
       this.config = {
         retentionDays: 7,
         cleanupPaths: [
           'test-results',
           'playwright-report',
           'visual-report',
           'test-artifacts',
         ],
         cleanupDatabase: true,
         ...config,
       };
     }

     /**
      * Run complete cleanup process
      */
     async runCleanup() {
       console.log('Starting test cleanup process...');

       await this.cleanupOldFiles();

       if (this.config.cleanupDatabase) {
         await this.cleanupTestDatabase();
       }

       console.log('Cleanup process completed successfully');
     }

     /**
      * Remove old test artifacts
      */
     private async cleanupOldFiles() {
       const now = Date.now();
       const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

       for (const path of this.config.cleanupPaths) {
         if (!existsSync(path)) continue;

         console.log(`Cleaning up ${path}...`);
         const items = readdirSync(path);

         for (const item of items) {
           const itemPath = join(path, item);
           const stats = statSync(itemPath);
           const age = now - stats.mtime.getTime();

           if (age > retentionMs) {
             console.log(`Removing old file: ${itemPath}`);
             rmSync(itemPath, { recursive: true, force: true });
           }
         }
       }
     }

     /**
      * Clean up test database
      */
     private async cleanupTestDatabase() {
       try {
         console.log('Cleaning up test database...');

         // Clean up old test data (keep only last 24 hours)
         const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

         await prisma.interview.deleteMany({
           where: {
             createdAt: { lt: oneDayAgo },
             AND: [
               {
                 OR: [
                   { identifier: { contains: 'test-' } },
                   { identifier: { contains: 'e2e-' } },
                 ],
               },
             ],
           },
         });

         await prisma.participant.deleteMany({
           where: {
             createdAt: { lt: oneDayAgo },
             AND: [
               {
                 OR: [
                   { identifier: { contains: 'test-' } },
                   { identifier: { contains: 'e2e-' } },
                 ],
               },
             ],
           },
         });

         await prisma.protocol.deleteMany({
           where: {
             createdAt: { lt: oneDayAgo },
             AND: [
               {
                 OR: [
                   { name: { contains: 'test-' } },
                   { name: { contains: 'e2e-' } },
                 ],
               },
             ],
           },
         });

         console.log('Database cleanup completed');
       } catch (error) {
         console.error('Database cleanup failed:', error);
       }
     }
   }

   // Script execution
   if (require.main === module) {
     const cleanup = new TestCleanup();
     cleanup.runCleanup().catch(console.error);
   }

   export { TestCleanup };
   ```

3. **Create health check script**:

   ```bash
   touch scripts/test-maintenance/health-check.ts
   ```

4. **Add health check implementation**:

   ```typescript
   // scripts/test-maintenance/health-check.ts
   import { execSync } from 'child_process';
   import { existsSync } from 'fs';
   import { prisma } from '../tests/e2e/utils/database/client';

   interface HealthCheckResult {
     status: 'healthy' | 'warning' | 'critical';
     checks: {
       name: string;
       status: 'pass' | 'fail';
       message: string;
     }[];
   }

   class TestHealthChecker {
     async runHealthCheck(): Promise<HealthCheckResult> {
       const checks = [
         await this.checkDatabaseConnection(),
         await this.checkPlaywrightInstallation(),
         await this.checkTestFiles(),
         await this.checkDiskSpace(),
         await this.checkDependencies(),
       ];

       const failures = checks.filter((check) => check.status === 'fail');
       const status =
         failures.length === 0
           ? 'healthy'
           : failures.length <= 2
             ? 'warning'
             : 'critical';

       return { status, checks };
     }

     private async checkDatabaseConnection() {
       try {
         await prisma.$queryRaw`SELECT 1`;
         return {
           name: 'Database Connection',
           status: 'pass' as const,
           message: 'Test database is accessible',
         };
       } catch (error) {
         return {
           name: 'Database Connection',
           status: 'fail' as const,
           message: `Database connection failed: ${error}`,
         };
       }
     }

     private async checkPlaywrightInstallation() {
       try {
         execSync('npx playwright --version', { stdio: 'pipe' });
         return {
           name: 'Playwright Installation',
           status: 'pass' as const,
           message: 'Playwright is properly installed',
         };
       } catch (error) {
         return {
           name: 'Playwright Installation',
           status: 'fail' as const,
           message: 'Playwright installation issue detected',
         };
       }
     }

     private async checkTestFiles() {
       const requiredPaths = [
         'tests/e2e',
         'playwright.config.ts',
         'tests/e2e/fixtures/index.ts',
       ];

       const missingPaths = requiredPaths.filter((path) => !existsSync(path));

       if (missingPaths.length === 0) {
         return {
           name: 'Test Files',
           status: 'pass' as const,
           message: 'All required test files are present',
         };
       } else {
         return {
           name: 'Test Files',
           status: 'fail' as const,
           message: `Missing required files: ${missingPaths.join(', ')}`,
         };
       }
     }

     private async checkDiskSpace() {
       try {
         const output = execSync('df -h .', { encoding: 'utf8' });
         const lines = output.split('\n');
         const data = lines[1].split(/\s+/);
         const usedPercent = parseInt(data[4].replace('%', ''));

         if (usedPercent < 80) {
           return {
             name: 'Disk Space',
             status: 'pass' as const,
             message: `Disk usage: ${usedPercent}%`,
           };
         } else {
           return {
             name: 'Disk Space',
             status: 'fail' as const,
             message: `Low disk space: ${usedPercent}% used`,
           };
         }
       } catch (error) {
         return {
           name: 'Disk Space',
           status: 'fail' as const,
           message: 'Unable to check disk space',
         };
       }
     }

     private async checkDependencies() {
       try {
         execSync('pnpm ls --depth=0', { stdio: 'pipe' });
         return {
           name: 'Dependencies',
           status: 'pass' as const,
           message: 'All dependencies are installed',
         };
       } catch (error) {
         return {
           name: 'Dependencies',
           status: 'fail' as const,
           message: 'Dependency issues detected',
         };
       }
     }
   }

   // Script execution
   if (require.main === module) {
     const healthChecker = new TestHealthChecker();
     healthChecker
       .runHealthCheck()
       .then((result) => {
         console.log(`Health Check Status: ${result.status.toUpperCase()}`);
         console.log('\nCheck Results:');
         result.checks.forEach((check) => {
           const icon = check.status === 'pass' ? '✅' : '❌';
           console.log(`${icon} ${check.name}: ${check.message}`);
         });

         process.exit(result.status === 'critical' ? 1 : 0);
       })
       .catch(console.error);
   }

   export { TestHealthChecker };
   ```

5. **Create package.json scripts for maintenance**:

   ```bash
   # Add these scripts to package.json
   ```

6. **Update package.json with maintenance scripts**:

   ```json
   {
     "scripts": {
       "test:cleanup": "tsx scripts/test-maintenance/cleanup.ts",
       "test:health": "tsx scripts/test-maintenance/health-check.ts",
       "test:full-suite": "pnpm test:health && pnpm exec playwright test",
       "test:ci": "pnpm test:health && pnpm exec playwright test --reporter=html,json,junit",
       "test:visual-update": "pnpm exec playwright test --config=playwright.visual.config.ts --update-snapshots",
       "test:maintenance": "pnpm test:cleanup && pnpm test:health"
     }
   }
   ```

## Task 8.5: Documentation & Developer Guide

**Objective**: Create comprehensive documentation for the testing suite and developer workflow.

**Steps**:

1. **Create testing documentation**:

   ```bash
   mkdir -p docs/testing
   touch docs/testing/README.md
   ```

2. **Add comprehensive testing guide**:

   ````markdown
   # E2E Testing Documentation

   This document provides comprehensive guidance for using the Playwright E2E testing suite in the Fresco application.

   ## Quick Start

   ```bash
   # Install dependencies
   pnpm install

   # Run health check
   pnpm test:health

   # Run all E2E tests
   pnpm exec playwright test

   # Run tests with UI
   pnpm exec playwright test --ui

   # Run specific test file
   pnpm exec playwright test dashboard
   ```
   ````

   ## Test Organization

   - **Phase 1**: Foundation setup and configuration
   - **Phase 2**: Database and seeding infrastructure
   - **Phase 3**: Authentication and core utilities
   - **Phase 4**: Visual testing and screenshot management
   - **Phase 5**: Dashboard route testing
   - **Phase 6**: Setup route testing
   - **Phase 7**: File upload and UploadThing integration
   - **Phase 8**: CI/CD integration and optimization

   ## Writing Tests

   ### Test Structure

   ```typescript
   import { test, expect } from '../fixtures';

   test.describe('Feature Name', () => {
     test.beforeEach(async ({ testData }) => {
       // Setup test data
     });

     test('should do something', async ({ page, authenticatedPage }) => {
       // Test implementation
     });
   });
   ```

   ### Available Fixtures

   - `authenticatedPage`: Pre-authenticated page with user session
   - `dashboardPage`: Dashboard page object
   - `setupPage`: Setup page object
   - `testData`: Seeded test data
   - `db`: Database client for data verification

   ## Best Practices

   1. **Use page objects** for complex interactions
   2. **Leverage fixtures** for consistent test setup
   3. **Write descriptive test names** that explain the behavior
   4. **Use data-testid** attributes for reliable element selection
   5. **Mock external services** for predictable tests
   6. **Clean up test data** after each test
   7. **Use visual snapshots** for UI regression testing

   ## Debugging

   ```bash
   # Run tests in headed mode
   pnpm exec playwright test --headed

   # Debug specific test
   pnpm exec playwright test --debug test-file.spec.ts

   # Generate trace
   pnpm exec playwright test --trace on

   # Show test report
   pnpm exec playwright show-report
   ```

   ## CI/CD Integration

   Tests run automatically on:

   - Push to main/develop branches
   - Pull requests to main
   - Scheduled runs (daily)

   ### Parallel Execution

   Tests are split across 4 shards for faster execution in CI.

   ### Artifact Storage

   - Test results: 7 days retention
   - Screenshots: 30 days retention
   - Visual regression reports: 14 days retention

   ## Maintenance

   ```bash
   # Clean up old test artifacts
   pnpm test:cleanup

   # Run health check
   pnpm test:health

   # Update visual snapshots
   pnpm test:visual-update
   ```

   ```

   ```

3. **Create troubleshooting guide**:

   ```bash
   touch docs/testing/TROUBLESHOOTING.md
   ```

4. **Add troubleshooting documentation**:

   ````markdown
   # Testing Troubleshooting Guide

   ## Common Issues

   ### Database Connection Errors

   **Problem**: Tests fail with database connection errors
   **Solution**:

   1. Ensure PostgreSQL is running: `docker ps`
   2. Check DATABASE_URL environment variable
   3. Run database migrations: `pnpm exec prisma migrate deploy`

   ### Playwright Browser Installation

   **Problem**: Browser not found errors
   **Solution**:

   ```bash
   pnpm exec playwright install
   pnpm exec playwright install-deps
   ```
   ````

   ### Flaky Tests

   **Problem**: Tests pass/fail inconsistently
   **Solutions**:

   1. Add proper wait conditions
   2. Use `page.waitForLoadState('networkidle')`
   3. Increase timeouts for slow operations
   4. Mock external dependencies

   ### Visual Regression Failures

   **Problem**: Screenshots don't match baselines
   **Solutions**:

   1. Update baselines: `pnpm test:visual-update`
   2. Check for animation/loading states
   3. Verify consistent viewport sizes
   4. Review threshold settings

   ### CI/CD Failures

   **Problem**: Tests pass locally but fail in CI
   **Solutions**:

   1. Check environment variables
   2. Verify Docker services are running
   3. Review artifact uploads
   4. Check shard distribution

   ## Performance Issues

   ### Slow Test Execution

   **Solutions**:

   1. Enable parallel execution
   2. Use test sharding
   3. Mock external services
   4. Optimize page loading

   ### Memory Issues

   **Solutions**:

   1. Close pages after tests
   2. Clean up browser contexts
   3. Limit concurrent workers
   4. Monitor resource usage

   ## Getting Help

   1. Check the test monitoring reports
   2. Review CI/CD logs
   3. Run health checks
   4. Consult the development team

   ```

   ```

## Verification Steps

1. **Verify CI/CD configuration is correct**:

   ```bash
   # Check workflow syntax
   pnpm exec playwright test --dry-run
   ```

2. **Test performance optimizations**:

   ```bash
   # Run performance monitoring
   pnpm exec playwright test --reporter=json
   ```

3. **Verify maintenance scripts**:

   ```bash
   # Test cleanup script
   pnpm test:cleanup

   # Test health check
   pnpm test:health
   ```

4. **Check documentation completeness**:
   - Ensure all phases are documented
   - Verify troubleshooting covers common issues
   - Confirm developer guide is comprehensive

## Next Steps After Phase 8

1. **Implementation**: Begin implementing the tests following the phase guides
2. **Team Training**: Train team members on the testing framework
3. **Monitoring Setup**: Configure alerting for test failures
4. **Continuous Improvement**: Regularly review and optimize test performance

This completes the comprehensive 8-phase plan for implementing robust E2E testing with Playwright for the Fresco application.
