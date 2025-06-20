/* eslint-disable no-process-env */
import { faker } from '@faker-js/faker';
import '~/envConfig.js';

// Set consistent seed for faker to ensure reproducible test data
faker.seed(parseInt(process.env.FAKER_SEED ?? '12345'));

export const testConfig = {
  database: {
    url: process.env.POSTGRES_PRISMA_URL!,
    nonPoolingUrl: process.env.POSTGRES_URL_NON_POOLING!,
    isolation: process.env.TEST_DATABASE_ISOLATION === 'true',
  },
  auth: {
    testUserPassword: process.env.TEST_USER_PASSWORD ?? 'testPassword123!',
    testAdminPassword: process.env.TEST_ADMIN_PASSWORD ?? 'adminPassword123!',
  },
  app: {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL,
  },
  testing: {
    parallelWorkers: parseInt(process.env.TEST_PARALLEL_WORKERS ?? '1'),
    retryCount: process.env.CI ? 2 : 0,
  },
};

// Validate required environment variables
export const validateTestConfig = () => {
  const required = ['POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
};
