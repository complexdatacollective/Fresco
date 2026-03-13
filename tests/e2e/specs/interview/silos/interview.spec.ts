/**
 * SILOS Protocol Tests
 *
 * Tests the protocol installation system and stage navigation:
 * 1. Install a real .netcanvas protocol file
 * 2. Extract and serve assets
 * 3. Create interviews for the protocol
 * 4. Navigate through stages with fixture-based API
 */

import path from 'node:path';
import { type InstalledProtocol } from '~/tests/e2e/fixtures/db-fixture.js';
import { expect, test } from '~/tests/e2e/fixtures/interview-test.js';

const SILOS_PROTOCOL_PATH = path.resolve(
  import.meta.dirname,
  '../../../data/silos.netcanvas',
);

test.describe('SILOS Protocol', () => {
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

  test.beforeEach(({ interview }) => {
    interview.interviewId = interviewId;
  });

  // ============================================================
  // Installation Tests
  // ============================================================

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

  // ============================================================
  // Stage Tests
  // ============================================================

  test('Stage 0: Welcome', async ({ page, interview }) => {
    await interview.goto(0);

    // Verify welcome stage content
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();

    // Information stage - should be able to proceed immediately
    await expect(interview.nextButton).toBeEnabled();
  });

  test('Stage 2: Self-Nomination', async ({ interview, stage }) => {
    await interview.goto(2);

    // Quick add should be enabled initially
    expect(await stage.quickAdd.isDisabled()).toBe(false);

    // Add the ego node using quick add
    await stage.quickAdd.addNode('Me');

    // Verify node was added
    await expect(stage.getNode('Me')).toBeVisible();

    // Quick add should be disabled (max 1 ego node)
    expect(await stage.quickAdd.isDisabled()).toBe(true);

    // Validation released - pulse animation visible
    expect(await interview.nextButtonHasPulse()).toBe(true);

    // Test deleting the node using keyboard (Ctrl+D, arrow keys, Enter)
    await stage.deleteNode('Me');

    // Verify the node was deleted
    await expect(stage.getNode('Me')).not.toBeVisible();

    // Quick add should be enabled again
    expect(await stage.quickAdd.isDisabled()).toBe(false);

    // Add the node again to proceed
    await stage.quickAdd.addNode('Me');
    await expect(stage.getNode('Me')).toBeVisible();
    await expect(interview.nextButton).toBeEnabled();
  });
});
