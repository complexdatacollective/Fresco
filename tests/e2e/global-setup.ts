import { type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { verifyDatabaseConnection } from '../../utils/db';
import '../envConfig.js';
import { validateTestConfig } from './utils/config';

async function globalSetup(_config: FullConfig) {
  // Clean up any existing containers first
  try {
    execSync('docker stop myapp-test 2>/dev/null', { stdio: 'pipe' });
    execSync('docker rm myapp-test 2>/dev/null', { stdio: 'pipe' });
  } catch {
    // Ignore errors if container doesn't exist
  }

  // eslint-disable-next-line no-console
  console.log('🚀 Starting global test setup...');

  // Validate configuration
  // eslint-disable-next-line no-console
  console.log('🔧 Validating test configuration...');
  try {
    validateTestConfig();
    // eslint-disable-next-line no-console
    console.log('✅ Test configuration valid');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Test configuration invalid:', error);
    throw error;
  }

  // Setup test database
  // eslint-disable-next-line no-console
  console.log('📊 Setting up test database...');
  try {
    execSync('./scripts/test/setup-test-db.sh', { stdio: 'inherit' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }

  // Verify database connection
  // eslint-disable-next-line no-console
  console.log('🔌 Verifying database connection...');
  const isConnected = await verifyDatabaseConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to test database');
  }
  // eslint-disable-next-line no-console
  console.log('✅ Database connection verified');

  // eslint-disable-next-line no-console
  console.log('✅ Global test setup complete!');
}

export default globalSetup;
