import { type FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(_config: FullConfig) {
  console.log('🔧 Setting up global test environment...');
  
  try {
    // Verify required environment variables
    const requiredEnvVars = ['TEST_USERNAME', 'TEST_PASSWORD'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Validate NODE_ENV is set correctly for tests
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  NODE_ENV is not set to "test". Some features may not work correctly.');
    }

    // Check optional but recommended environment variables
    if (!process.env.POSTGRES_PRISMA_URL) {
      console.warn('⚠️  POSTGRES_PRISMA_URL not set. Database tests may fail.');
    }

    console.log('✅ Environment variable validation passed');

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