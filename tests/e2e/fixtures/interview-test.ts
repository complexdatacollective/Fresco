/**
 * Interview test fixtures.
 *
 * Extends the base test with `interview` and `stage` fixtures for testing
 * interview flows with proper separation of concerns:
 *
 * - `interview` - Navigation and interview shell (goto, nextButton)
 * - `stage` - Stage-specific interactions (quickAdd, nodes, deleteNode)
 * - `page` - Raw Playwright page for assertions
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '~/tests/e2e/fixtures/interview-test.js';
 *
 * test.describe('My Interview Test', () => {
 *   let interviewId: string;
 *
 *   test.beforeAll(async ({ database, protocol }) => {
 *     const { protocolId } = await protocol.install(PROTOCOL_PATH);
 *     interviewId = await protocol.createInterview(protocolId);
 *   });
 *
 *   test.beforeEach(({ interview }) => {
 *     interview.interviewId = interviewId;
 *   });
 *
 *   test('Stage 0', async ({ interview }) => {
 *     await interview.goto(0);
 *     await expect(interview.nextButton).toBeEnabled();
 *   });
 * });
 * ```
 */

import { test as baseTest, expect } from './test.js';
import { type Locator } from '@playwright/test';
import { getContext, getSuiteId } from '../helpers/context.js';
import { InterviewFixture } from './interview-fixture.js';
import { ProtocolFixture } from './protocol-fixture.js';
import { StageFixture } from './stage-fixture.js';

type CaptureInterviewOptions = {
  mask?: Locator[];
  maxDiffPixelRatio?: number;
};

type InterviewTestFixtures = {
  interview: InterviewFixture;
  stage: StageFixture;
  captureInterview: (
    name: string,
    options?: CaptureInterviewOptions,
  ) => Promise<void>;
};

type InterviewWorkerFixtures = {
  protocol: ProtocolFixture;
};

export const test = baseTest.extend<
  InterviewTestFixtures,
  InterviewWorkerFixtures
>({
  protocol: [
     
    async ({ database }, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const suiteId = getSuiteId(projectName);
      const context = await getContext(suiteId);
      const protocol = new ProtocolFixture(
        database.prisma,
        context.assetServerUrl,
      );

      await use(protocol);
      await protocol.cleanup();
    },
    { scope: 'worker' },
  ],

  // Use soft assertions for screenshots to avoid retries resetting serial test state.
  // Soft assertions don't stop execution or trigger retries - failures are collected
  // and reported at the end. This allows --update-snapshots to work without breaking
  // subsequent stages.
  captureInterview: async ({ page }, use) => {
    // eslint-disable-next-line no-process-env
    const isCI = !!process.env.CI;

    await use(async (name: string, options: CaptureInterviewOptions = {}) => {
      // Only capture screenshots in CI
      if (!isCI) {
        return;
      }

      // Use soft assertion - doesn't trigger retries on failure.
      // Default to 2% tolerance for interview screenshots — they run in
      // Docker where minor rendering variations between runs are expected.
      await expect.soft(page).toHaveScreenshot(`${name}.png`, {
        fullPage: false,
        mask: options.mask,
        maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.02,
      });
    });
  },

  interview: async ({ page, captureInterview }, use) => {
    const interview = new InterviewFixture(page);
    interview.setCaptureFn(captureInterview);
    await use(interview);
  },

  stage: async ({ page }, use) => {
    const stage = new StageFixture(page);
    await use(stage);
  },
});

export { expect };
