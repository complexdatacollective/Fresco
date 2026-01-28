import { test, expect } from '../../fixtures/test.js';
import {
  getProtocolId,
  updateAppSetting,
  getParticipantCount,
} from '../../helpers/database.js';

test.describe('Onboard Integration', () => {
  test.describe('Read-only', () => {
    test('GET with participantIdentifier redirects to interview', async ({
      page,
      databaseUrl,
    }) => {
      const protocolId = await getProtocolId(databaseUrl);
      await page.goto(`/onboard/${protocolId}?participantIdentifier=E2E-001`);
      await page.waitForURL('**/interview/**');
      expect(page.url()).toContain('/interview/');
    });

    test('GET anonymous (enabled by default) redirects to interview', async ({
      page,
      databaseUrl,
    }) => {
      const protocolId = await getProtocolId(databaseUrl);
      await page.goto(`/onboard/${protocolId}`);
      await page.waitForURL('**/interview/**');
      expect(page.url()).toContain('/interview/');
    });

    test('invalid protocol ID redirects to error page', async ({ page }) => {
      await page.goto('/onboard/nonexistent-id');
      await page.waitForURL('**/onboard/error');
      expect(page.url()).toContain('/onboard/error');
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('POST with JSON body redirects to interview', async ({
      page,
      database,
      databaseUrl,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await getProtocolId(databaseUrl);
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
      databaseUrl,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await getProtocolId(databaseUrl);
        const identifier = 'REUSE-001';

        await page.goto(
          `/onboard/${protocolId}?participantIdentifier=${identifier}`,
        );
        await page.waitForURL('**/interview/**');

        await page.goto(
          `/onboard/${protocolId}?participantIdentifier=${identifier}`,
        );
        await page.waitForURL('**/interview/**');

        const count = await getParticipantCount(databaseUrl, identifier);
        expect(count).toBe(1);
      } finally {
        await cleanup();
      }
    });

    test('anonymous recruitment disabled redirects to no-anonymous-recruitment', async ({
      page,
      database,
      databaseUrl,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await getProtocolId(databaseUrl);
        await updateAppSetting(
          databaseUrl,
          'allowAnonymousRecruitment',
          'false',
        );

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
      databaseUrl,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const protocolId = await getProtocolId(databaseUrl);
        await updateAppSetting(databaseUrl, 'limitInterviews', 'true');

        // First onboard — completes and sets cookie
        await page.goto(
          `/onboard/${protocolId}?participantIdentifier=LIMIT-001`,
        );
        await page.waitForURL('**/interview/**');

        // Finish the interview to set the cookie
        // Navigate to the finish endpoint by evaluating the protocol-based cookie
        await page.context().addCookies([
          {
            name: protocolId,
            value: 'completed',
            domain: new URL(page.url()).hostname,
            path: '/',
          },
        ]);

        // Second onboard should redirect to finished
        await page.goto(
          `/onboard/${protocolId}?participantIdentifier=LIMIT-002`,
        );
        await page.waitForURL('**/interview/finished');
        expect(page.url()).toContain('/interview/finished');
      } finally {
        await cleanup();
      }
    });
  });
});
