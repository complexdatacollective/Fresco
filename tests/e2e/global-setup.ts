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