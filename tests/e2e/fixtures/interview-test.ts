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

import {
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from '@playwright/test';
import { getContext, getSuiteId } from '../helpers/context.js';
import { InterviewFixture } from './interview-fixture.js';
import { ProtocolFixture } from './protocol-fixture.js';
import { StageFixture } from './stage-fixture.js';
import { test as baseTest, expect } from './test.js';

type CaptureInterviewOptions = {
  mask?: Locator[];
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
  sharedContext: BrowserContext;
  sharedPage: Page;
};

// Keys from the project's `use` config that are valid BrowserContextOptions.
// Copied into the worker-scoped context so it inherits baseURL, viewport,
// device emulation, etc. from playwright.config.ts.
const CONTEXT_OPTION_KEYS = [
  'baseURL',
  'viewport',
  'userAgent',
  'deviceScaleFactor',
  'isMobile',
  'hasTouch',
  'locale',
  'timezoneId',
  'colorScheme',
  'reducedMotion',
  'forcedColors',
  'acceptDownloads',
  'bypassCSP',
  'extraHTTPHeaders',
  'geolocation',
  'httpCredentials',
  'ignoreHTTPSErrors',
  'javaScriptEnabled',
  'offline',
  'permissions',
  'proxy',
  'storageState',
] as const satisfies readonly (keyof BrowserContextOptions)[];

function pickContextOptions(
  projectUse: BrowserContextOptions & {
    contextOptions?: BrowserContextOptions;
  },
): BrowserContextOptions {
  const picked: BrowserContextOptions = {};
  for (const key of CONTEXT_OPTION_KEYS) {
    if (key in projectUse) {
      Object.assign(picked, { [key]: projectUse[key] });
    }
  }
  if (projectUse.contextOptions) {
    Object.assign(picked, projectUse.contextOptions);
  }
  return picked;
}

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

  sharedContext: [
    async ({ browser }, use, workerInfo) => {
      const options = pickContextOptions(workerInfo.project.use);
      const context = await browser.newContext(options);
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  sharedPage: [
    async ({ sharedContext }, use) => {
      const page = await sharedContext.newPage();
      await use(page);
    },
    { scope: 'worker' },
  ],

  context: async ({ sharedContext }, use) => {
    await use(sharedContext);
  },

  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },

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
