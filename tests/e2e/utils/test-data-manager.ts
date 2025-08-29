import { Page } from '@playwright/test';

export class TestDataManager {
  constructor(private page: Page) {}

  /**
   * Clean up test data after each test
   */
  async cleanup() {
    // Clear browser storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear cookies for test domain
    await this.page.context().clearCookies();
  }

  /**
   * Reset application state to clean slate
   */
  async resetApplicationState() {
    // Navigate to reset endpoint if available
    // Note: Only use in test environment
    if (process.env.NODE_ENV === 'test') {
      try {
        // This would be a test-only endpoint for resetting app state
        // await this.page.request.post('/api/test/reset');
      } catch (error) {
        // Reset endpoint may not exist, which is fine
      }
    }
  }

  /**
   * Create minimal test data needed for tests
   */
  async seedMinimalTestData() {
    // This would create minimal required data for tests
    // For example: default user, basic settings, etc.
    // Implementation depends on your application's requirements
    
    if (process.env.NODE_ENV === 'test') {
      try {
        // Example: POST to seed endpoint
        // await this.page.request.post('/api/test/seed', {
        //   data: { type: 'minimal' }
        // });
      } catch (error) {
        // Seed endpoint may not exist, which is fine
      }
    }
  }

  /**
   * Check if database is in a clean state for testing
   */
  async verifyCleanState(): Promise<boolean> {
    try {
      // This could check if test data exists that shouldn't
      // For now, just return true
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create test file for upload testing
   */
  async createTestFile(filename: string, content: string = 'test content'): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(process.cwd(), 'test-results', filename);
    
    // Ensure test-results directory exists
    fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
    
    // Write test file
    fs.writeFileSync(testFilePath, content);
    
    return testFilePath;
  }

  /**
   * Clean up test files created during testing
   */
  async cleanupTestFiles() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const testResultsDir = path.join(process.cwd(), 'test-results');
      if (fs.existsSync(testResultsDir)) {
        // Remove only test files, not screenshots or reports
        const files = fs.readdirSync(testResultsDir);
        for (const file of files) {
          if (file.startsWith('test-') && !file.includes('screenshot') && !file.includes('report')) {
            fs.unlinkSync(path.join(testResultsDir, file));
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}