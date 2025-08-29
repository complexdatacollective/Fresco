import { type FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Tearing down global test environment...');
  
  try {
    // Cleanup auth files but keep directory structure
    await execAsync('rm -f tests/e2e/.auth/*.json').catch(() => {
      // Ignore if files don't exist
    });
    
    // Clean up test artifacts and screenshots older than 7 days
    console.log('🗑️  Cleaning old test artifacts...');
    await execAsync('find test-results -name "*.png" -mtime +7 -delete 2>/dev/null || true').catch(() => {
      // Ignore if command fails
    });
    
    // Clean up temporary screenshot files
    await execAsync('rm -f test-results/screenshots/temp-*.png').catch(() => {
      // Ignore if files don't exist
    });
    
    // Optional: Clean up test data from database in test environment
    if (process.env.POSTGRES_PRISMA_URL && process.env.NODE_ENV === 'test') {
      console.log('🔄 Test database cleanup available but skipped for safety');
      // Uncomment if you want to clean test database:
      // await execAsync('npx prisma db push --force-reset --skip-generate', {
      //   env: { ...process.env, NODE_ENV: 'test' }
      // });
    }
    
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.warn('⚠️  Teardown warning:', error);
    // Don't fail teardown
  }
}

export default globalTeardown;