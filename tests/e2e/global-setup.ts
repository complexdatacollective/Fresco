import { type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🚀 GLOBAL SETUP STARTED - This should appear first!');
  
  // Import environment config
  try {
    await import('../../envConfig.js');
    // eslint-disable-next-line no-console
    console.log('✅ Environment config loaded');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to load environment config:', error);
    throw error;
  }

  // Clean up any existing containers first
  try {
    execSync('docker stop myapp-test 2>/dev/null', { stdio: 'pipe' });
    execSync('docker rm myapp-test 2>/dev/null', { stdio: 'pipe' });
    // eslint-disable-next-line no-console
    console.log('✅ Cleaned up existing containers');
  } catch {
    // eslint-disable-next-line no-console
    console.log('ℹ️  No existing containers to clean up');
  }

  // eslint-disable-next-line no-console
  console.log('🚀 Starting global test setup...');

  // Validate configuration
  // eslint-disable-next-line no-console
  console.log('🔧 Validating test configuration...');
  try {
    const { validateTestConfig } = await import('./utils/config');
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
  try {
    const { verifyDatabaseConnection } = await import('../../utils/db');
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to test database');
    }
    // eslint-disable-next-line no-console
    console.log('✅ Database connection verified');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // CRITICAL: Invalidate all caches at the end of global setup
  // This ensures the webServer starts with fresh cache and doesn't use stale app settings
  // eslint-disable-next-line no-console
  console.log('🔄 Invalidating all caches to ensure fresh start...');
  try {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
    
    // Wait a moment for the webServer to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${baseURL}/api/test/database-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'invalidateCache' }),
    });

    if (response.ok) {
      const result = await response.json();
      // eslint-disable-next-line no-console
      console.log('✅ Global cache invalidation:', result.message);
    } else {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Cache invalidation failed during global setup');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Cache invalidation API not available during global setup:', error);
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global test setup complete!');
}

export default globalSetup;
