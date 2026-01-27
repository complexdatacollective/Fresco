import { expect, test } from '../../fixtures/fixtures';

test.describe.serial('Onboard Integration', () => {
  test('GET with participantIdentifier creates new participant and redirects to interview', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('getNewParticipant', async () => {
      const newParticipantIdentifier = `NEW-GET-${Date.now()}`;

      // Navigate using GET with query parameter
      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${newParticipantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Should redirect to interview page
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/[a-z0-9-]+/);

      // The interview page should be visible
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('GET with existing participantIdentifier links to existing participant', async ({
    page,
    database,
  }) => {
    const testData = database.testData;
    if (!testData) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('getExistingParticipant', async () => {
      // Use an existing participant from test data (P011-P020 don't have interviews)
      const existingParticipant = testData.participants.find(
        (p) => p.identifier === 'P011',
      );

      if (!existingParticipant) {
        throw new Error('Test participant P011 not found');
      }

      // Navigate using GET with existing participant identifier
      await page.goto(
        `/onboard/${testData.protocol.id}?participantIdentifier=${existingParticipant.identifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Should redirect to interview page
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/[a-z0-9-]+/);
    });
  });

  test('POST with participantIdentifier in body creates interview', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('postNewParticipant', async () => {
      const newParticipantIdentifier = `NEW-POST-${Date.now()}`;

      // Use page.request to make a POST request
      const response = await page.request.post(`/onboard/${protocolId}`, {
        data: { participantIdentifier: newParticipantIdentifier },
        headers: { 'Content-Type': 'application/json' },
        maxRedirects: 0, // Don't follow redirects to check the response
      });

      // Should get a redirect response (307)
      expect(response.status()).toBe(307);

      // The redirect location should be to an interview
      const location = response.headers().location;
      expect(location).toMatch(/\/interview\/[a-z0-9-]+/);
    });
  });

  test('POST with existing participantIdentifier links to existing participant', async ({
    page,
    database,
  }) => {
    const testData = database.testData;
    if (!testData) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('postExistingParticipant', async () => {
      // Use an existing participant from test data
      const existingParticipant = testData.participants.find(
        (p) => p.identifier === 'P012',
      );

      if (!existingParticipant) {
        throw new Error('Test participant P012 not found');
      }

      const response = await page.request.post(
        `/onboard/${testData.protocol.id}`,
        {
          data: { participantIdentifier: existingParticipant.identifier },
          headers: { 'Content-Type': 'application/json' },
          maxRedirects: 0,
        },
      );

      expect(response.status()).toBe(307);
      const location = response.headers().location;
      expect(location).toMatch(/\/interview\/[a-z0-9-]+/);
    });
  });

  test('GET without participantIdentifier creates anonymous participant', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('getAnonymousParticipant', async () => {
      // Navigate without participantIdentifier (anonymous recruitment is enabled in test setup)
      await page.goto(`/onboard/${protocolId}`, {
        waitUntil: 'domcontentloaded',
      });

      // Should redirect to interview page
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/[a-z0-9-]+/);
    });
  });

  test('POST without participantIdentifier creates anonymous participant', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('postAnonymousParticipant', async () => {
      const response = await page.request.post(`/onboard/${protocolId}`, {
        data: {},
        headers: { 'Content-Type': 'application/json' },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(307);
      const location = response.headers().location;
      expect(location).toMatch(/\/interview\/[a-z0-9-]+/);
    });
  });

  test('GET with invalid protocolId redirects to error page', async ({
    page,
  }) => {
    await page.goto('/onboard/undefined', {
      waitUntil: 'domcontentloaded',
    });

    // Should redirect to error page
    await page.waitForURL(/\/onboard\/error/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/onboard\/error/);
  });

  test('GET with non-existent protocolId redirects to error page', async ({
    page,
  }) => {
    await page.goto('/onboard/non-existent-protocol-id-12345', {
      waitUntil: 'domcontentloaded',
    });

    // Should redirect to error page
    await page.waitForURL(/\/onboard\/error/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/onboard\/error/);
  });
});

test.describe('Onboard Integration - Limit Interviews', () => {
  test('with limitInterviews enabled, redirects to finished when cookie exists', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    // Use withSnapshot to automatically restore state after test
    await database.withSnapshot('limitInterviews', async () => {
      // Enable limitInterviews setting
      await database.prisma.appSettings.upsert({
        where: { key: 'limitInterviews' },
        update: { value: 'true' },
        create: { key: 'limitInterviews', value: 'true' },
      });

      // Clear Next.js cache so the setting change takes effect
      await database.clearNextCache();

      // Set the protocol completion cookie (simulating a completed interview)
      // The cookie name is the protocolId and value is 'completed'
      await page.context().addCookies([
        {
          name: protocolId,
          value: 'completed',
          domain: new URL(database.appUrl).hostname,
          path: '/',
        },
      ]);

      // Try to access onboard - should redirect to finished
      await page.goto(`/onboard/${protocolId}`, {
        waitUntil: 'domcontentloaded',
      });

      // Should redirect to the finished page
      await page.waitForURL(/\/interview\/finished/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/finished/);
    });
  });

  test('with limitInterviews enabled, allows interview when no cookie exists', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('limitInterviewsNoCookie', async () => {
      // Enable limitInterviews setting
      await database.prisma.appSettings.upsert({
        where: { key: 'limitInterviews' },
        update: { value: 'true' },
        create: { key: 'limitInterviews', value: 'true' },
      });

      // Clear Next.js cache so the setting change takes effect
      await database.clearNextCache();

      // Ensure no completion cookie exists
      await page.context().clearCookies();

      const participantIdentifier = `LIMIT-NO-COOKIE-${Date.now()}`;

      // Try to access onboard - should create interview successfully
      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Should redirect to interview page (not finished)
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/[a-z0-9-]+/);
      expect(page.url()).not.toMatch(/\/interview\/finished/);
    });
  });

  test('with limitInterviews disabled, allows interview even with cookie', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('limitInterviewsDisabled', async () => {
      // Ensure limitInterviews is disabled (should be default, but be explicit)
      await database.prisma.appSettings.upsert({
        where: { key: 'limitInterviews' },
        update: { value: 'false' },
        create: { key: 'limitInterviews', value: 'false' },
      });

      // Clear Next.js cache so the setting change takes effect
      await database.clearNextCache();

      // Set the protocol completion cookie
      await page.context().addCookies([
        {
          name: protocolId,
          value: 'completed',
          domain: new URL(database.appUrl).hostname,
          path: '/',
        },
      ]);

      const participantIdentifier = `LIMIT-DISABLED-${Date.now()}`;

      // Try to access onboard - should still create interview
      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Should redirect to interview page (not finished)
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/interview\/[a-z0-9-]+/);
      expect(page.url()).not.toMatch(/\/interview\/finished/);
    });
  });
});
