import { type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { prisma } from '~/utils/db';

async function globalTeardown(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🧹 Starting global test teardown...');

  // Disconnect from test database
  // eslint-disable-next-line no-console
  console.log('🔌 Disconnecting from test database...');
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('✅ Database disconnected');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Database disconnect failed:', error);
  }

  // Cleanup test database
  // eslint-disable-next-line no-console
  console.log('📊 Removing test database container...');
  try {
    execSync('./scripts/test/teardown-test-db.sh', { stdio: 'inherit' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Database cleanup failed:', error);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global test teardown complete!');
}

export default globalTeardown;
