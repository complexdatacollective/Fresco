import { type FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(_config: FullConfig) {
  console.log('🔧 Setting up global test environment...');
  
  try {
    // Verify environment variables
    if (!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD) {
      throw new Error('Missing TEST_USERNAME or TEST_PASSWORD environment variables');
    }

    // Verify database connection
    if (process.env.POSTGRES_PRISMA_URL) {
      console.log('📊 Verifying database connection...');
      try {
        await execAsync('npx prisma db push --skip-generate', {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        console.log('✅ Database schema synchronized');
      } catch (error) {
        console.warn('⚠️  Database setup warning:', error);
        // Don't fail if database is already set up
      }
    }

    // Create test directories
    await execAsync('mkdir -p tests/e2e/.auth test-results playwright-report');
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;