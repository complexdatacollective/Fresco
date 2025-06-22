import { type FullConfig } from '@playwright/test';
import { exec, execSync } from 'child_process';

type PostgresConfig = {
  containerName: string;
  dbName: string;
  user: string;
  maxAttempts?: number;
  delayMs?: number;
};

function waitForPostgres({
  containerName,
  dbName,
  user,
  maxAttempts = 30,
  delayMs = 1000,
}: PostgresConfig): void {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync(
        `docker exec ${containerName} pg_isready -d ${dbName} -U ${user}`,
        { stdio: 'pipe' },
      );
      return;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(
          `PostgreSQL did not become ready after ${maxAttempts} attempts`,
        );
      }
      execSync(`sleep ${delayMs / 1000}`);
    }
  }
}

async function globalSetup(_config: FullConfig) {
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
    execSync('docker stop fresco-postgres-test 2>/dev/null', { stdio: 'pipe' });
    execSync('docker rm fresco-postgres-test 2>/dev/null', { stdio: 'pipe' });
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
  try {
    // eslint-disable-next-line no-console
    console.log('📊 Setting up test database...');
    // In CI, database is started externally, so we skip this step
    // eslint-disable-next-line no-process-env
    if (!process.env.CI) {
      // eslint-disable-next-line no-console
      console.log('🐳 Starting container with docker-compose...');

      execSync('docker-compose -f docker-compose.test.yml up -d', {
        stdio: 'inherit',
      });

      // eslint-disable-next-line no-console
      console.log('⏳ Waiting for database to be ready...');
      waitForPostgres({
        containerName: 'fresco-postgres-test',
        dbName: 'postgres',
        user: 'postgres',
      });
    }

    // eslint-disable-next-line no-console
    console.log('📀 Running database migrations...');

    // Run Prisma migrations
    execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });

    //eslint-disable-next-line no-console
    console.log('✅ Test database setup complete!');
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

  // Launch nextjs test dev server
  try {
    exec('pnpm dev:test', (error, stdout, stderr) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to launch Next.js test dev server:', error);
        throw error;
      }
      if (stdout) {
        // eslint-disable-next-line no-console
        console.log(`Next.js dev server stdout: ${stdout}`);
      }
      if (stderr) {
        // eslint-disable-next-line no-console
        console.error(`Next.js dev server stderr: ${stderr}`);
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to launch Next.js test dev server:', error);
    throw error;
  }

  // CRITICAL: Invalidate all caches at the end of global setup
  // This ensures the webServer starts with fresh cache and doesn't use stale app settings
  // eslint-disable-next-line no-console
  console.log('🔄 Invalidating all caches to ensure fresh start...');
  try {
    // eslint-disable-next-line no-process-env
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001';

    // Wait a moment for the webServer to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(`${baseURL}/api/test/database-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'invalidateCache' }),
    });

    if (response.ok) {
      const result = (await response.json()) as { message?: string };
      // eslint-disable-next-line no-console
      console.log('✅ Global cache invalidation:', result.message ?? 'Success');
    } else {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Cache invalidation failed during global setup');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️ Cache invalidation API not available during global setup:',
      error,
    );
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global test setup complete!');
}

export default globalSetup;
