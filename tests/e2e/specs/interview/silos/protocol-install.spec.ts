/**
 * Protocol Installation Tests
 *
 * These tests verify that the protocol installer can correctly:
 * 1. Install a real .netcanvas protocol file
 * 2. Extract and serve assets
 * 3. Create interviews for the protocol
 * 4. Load the interview
 *
 */

import path from 'node:path';
import { type InstalledProtocol } from '~/tests/e2e/fixtures/db-fixture.js';
import { expect, test } from '~/tests/e2e/fixtures/test.js';
import {
  getNextButton,
  gotoStage,
  waitForStageLoad,
} from '~/tests/e2e/helpers/interview.js';

const SILOS_PROTOCOL_PATH = path.resolve(
  import.meta.dirname,
  '../../../data/silos.netcanvas',
);

test.describe('SILOS Protocol Installation', () => {
  test.describe.configure({ mode: 'serial' });

  let installedProtocol: InstalledProtocol;
  let interviewId: string;

  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();

    // Install the SILOS protocol
    installedProtocol =
      await database.installProtocolFromFile(SILOS_PROTOCOL_PATH);

    // Create an interview
    interviewId = await database.createInterviewForProtocol(
      installedProtocol.protocolId,
    );
  });

  test.afterAll(async ({ database }) => {
    await database.cleanupInstalledProtocols();
  });

  test('installs protocol with correct metadata', () => {
    expect(installedProtocol.protocolId).toBeTruthy();
    expect(installedProtocol.name).toBeTruthy();
    expect(installedProtocol.stages.length).toBeGreaterThan(0);
    expect(installedProtocol.codebook).toBeTruthy();
  });

  test('creates interview for protocol', () => {
    expect(interviewId).toBeTruthy();
  });

  test('serves extracted assets', async ({ request }) => {
    // Find an asset URL from the protocol stages (URLs have been rewritten to /e2e-assets/...)
    const protocolJson = JSON.stringify(installedProtocol.stages);
    const assetMatch = /\/e2e-assets\/[^"]+/.exec(protocolJson);

    if (!assetMatch) {
      test.skip(true, 'No assets found in protocol stages');
      return;
    }

    const assetUrl = assetMatch[0];
    const response = await request.get(assetUrl);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-length']).toBeDefined();
  });

  test('loads Stage 0: Welcome (Information)', async ({ page }) => {
    await gotoStage(page, interviewId, 0);
    await waitForStageLoad(page);

    // Verify we're on a stage (stage container has id="stage")
    await expect(page.locator('#stage')).toBeVisible();

    // Next button should be enabled on Information stages
    await expect(getNextButton(page)).toBeEnabled();
  });

  test('can access interview directly by URL', async ({ page }) => {
    await page.goto(`/interview/${interviewId}`);
    await waitForStageLoad(page);

    // Should load without errors (stage container has id="stage")
    await expect(page.locator('#stage')).toBeVisible();
  });
});
