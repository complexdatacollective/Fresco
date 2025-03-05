import { test as teardown } from '@playwright/test';
import { execSync } from 'child_process';

teardown('delete test database', () => {
  // Stop and remove test db
  execSync('docker-compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
});