import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

setup('create test database', () => {
  // Stop any existing test db to ensure clean state
  try { 
    execSync('docker-compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
  } catch (error) {
    // Ignore errors if no existing container
  }
  
  // Start test db
  execSync('docker-compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });
  
  // Optional: Wait for database to be ready
  console.log('Waiting for database to be ready');
  execSync('sleep 5', { stdio: 'inherit' });
  
  // setup database and initialize
  execSync('dotenv -e .env.local node ./setup-database.js && node ./initialize.js', { stdio: 'inherit' });
});