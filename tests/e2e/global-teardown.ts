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
    
    // Optional: Clean up test data from database
    // if (process.env.POSTGRES_PRISMA_URL && process.env.NODE_ENV === 'test') {
    //   console.log('🗑️  Cleaning test database...');
    //   // Add database cleanup if needed
    // }
    
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.warn('⚠️  Teardown warning:', error);
    // Don't fail teardown
  }
}

export default globalTeardown;