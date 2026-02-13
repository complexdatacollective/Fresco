import { expect, test } from '../../fixtures/test.js';

test.describe('Onboard Integration', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests complete, before mutations start.
    // This reduces wait time for mutation tests that need exclusive locks.
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('invalid protocol ID redirects to error page', async ({ page }) => {
      await page.goto('/onboard/nonexistent-id');
      await page.waitForURL('**/onboard/error');
      expect(page.url()).toContain('/onboard/error');
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('GET with participantIdentifier redirects to interview', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        const response = await page.request.get(
          `/onboard/${protocolId}?participantIdentifier=E2E-001`,
        );
        expect(response.url()).toContain('/interview/');
      } finally {
        await cleanup();
      }
    });

    test('GET anonymous (enabled by default) redirects to interview', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        const response = await page.request.get(`/onboard/${protocolId}`);
        expect(response.url()).toContain('/interview/');
      } finally {
        await cleanup();
      }
    });

    test('POST with JSON body redirects to interview', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        const response = await page.request.post(`/onboard/${protocolId}`, {
          data: { participantIdentifier: 'POST-001' },
        });

        expect(response.status()).toBe(200);
        const url = response.url();
        expect(url).toContain('/interview/');
      } finally {
        await cleanup();
      }
    });

    test('participant reuse with same identifier', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        const identifier = 'REUSE-001';

        const response1 = await page.request.get(
          `/onboard/${protocolId}?participantIdentifier=${identifier}`,
        );
        expect(response1.url()).toContain('/interview/');

        const response2 = await page.request.get(
          `/onboard/${protocolId}?participantIdentifier=${identifier}`,
        );
        expect(response2.url()).toContain('/interview/');

        const count = await database.getParticipantCount(identifier);
        expect(count).toBe(1);
      } finally {
        await cleanup();
      }
    });

    test('anonymous recruitment disabled redirects to no-anonymous-recruitment', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        await database.updateAppSetting('allowAnonymousRecruitment', 'false');

        await page.goto(`/onboard/${protocolId}`);
        await page.waitForURL('**/onboard/no-anonymous-recruitment');
        expect(page.url()).toContain('/onboard/no-anonymous-recruitment');
      } finally {
        await cleanup();
      }
    });

    test('limitInterviews prevents second interview', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await database.getProtocolId();
        await database.updateAppSetting('limitInterviews', 'true');

        // First onboard — creates interview and redirects
        const firstResponse = await page.request.get(
          `/onboard/${protocolId}?participantIdentifier=LIMIT-001`,
        );
        expect(firstResponse.url()).toContain('/interview/');

        // Second onboard with completed cookie should redirect to finished
        const secondResponse = await page.request.get(
          `/onboard/${protocolId}?participantIdentifier=LIMIT-002`,
          {
            headers: { Cookie: `${protocolId}=completed` },
          },
        );
        expect(secondResponse.url()).toContain('/interview/finished');
      } finally {
        await cleanup();
      }
    });
  });
});
