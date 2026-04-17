/* eslint-disable no-process-env */
import { test as base, expect } from '@playwright/test';
import { createTestPrisma, type TestPrismaClient } from '../helpers/prisma.js';

type NoTestFixtures = object;

type WorkerFixtures = {
  prisma: TestPrismaClient;
};

export const test = base.extend<NoTestFixtures, WorkerFixtures>({
  prisma: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const url = process.env.E2E_DATABASE_URL;
      if (!url) throw new Error('E2E_DATABASE_URL not set by globalSetup');
      const client = createTestPrisma(url);
      await use(client);
      await client.$disconnect();
    },
    { scope: 'worker' },
  ],
});

export { expect };
