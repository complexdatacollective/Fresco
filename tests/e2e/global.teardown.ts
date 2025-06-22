import { type FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { prisma } from '~/utils/db';

function killProcessByPort(port: number): void {
  try {
    if (process.platform === 'win32') {
      execSync(
        `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`,
        { stdio: 'ignore' },
      );
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  No process found on port ${port} to kill`);
  }
}

async function globalTeardown(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🧹 Starting global test teardown...');

  // Stop pnpm nextjs dev test task
  // eslint-disable-next-line no-console
  console.log('🛑 Stopping pnpm nextjs dev test task...');
  try {
    // Kill the process running on port 3001
    killProcessByPort(3001);
    // eslint-disable-next-line no-console
    console.log('✅ pnpm nextjs dev test task stopped');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('⚠️  Failed to stop pnpm nextjs dev test task:', error);
  }

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

  // Skip if we are in CI environment
  // eslint-disable-next-line no-process-env
  if (!process.env.CI) {
    // eslint-disable-next-line no-console
    console.log('📊 Removing test database container...');
    try {
      execSync('docker-compose -f docker-compose.test.yml down -v', {
        stdio: 'inherit',
      });

      // eslint-disable-next-line no-console
      console.log('✅ Test database cleanup complete!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('⚠️  Database cleanup failed:', error);
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Global test teardown complete!');
}

export default globalTeardown;
