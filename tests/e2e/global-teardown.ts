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