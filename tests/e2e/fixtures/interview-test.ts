/* eslint-disable no-process-env */
import {
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from '@playwright/test';
import { InterviewFixture } from './interview-fixture.js';
import { ProtocolFixture } from './protocol-fixture.js';
import { StageFixture } from './stage-fixture.js';
import { test as baseTest, expect } from './test.js';

const VISUAL_STYLES = `
  [data-testid="background-blobs"] { visibility: hidden !important; }
  *, *::before, *::after {
    animation: none !important;
    animation-duration: 0s !important;
    transition: none !important;
    transition-duration: 0s !important;
  }
  *:focus-visible,
  *:has(:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
  }
  .focusable-after::after,
  .focusable-after-within::after {
    outline: none !important;
    box-shadow: none !important;
    content: none !important;
  }
`;

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
    async ({ prisma }, use) => {
      const assetUrl = process.env.E2E_ASSET_URL;
      if (!assetUrl) throw new Error('E2E_ASSET_URL not set by globalSetup');
      const protocol = new ProtocolFixture(prisma, assetUrl);
      await use(protocol);
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

  captureInterview: async ({ page }, use) => {
    const isCI = !!process.env.CI;
    let stylesInjected = false;

    await use(async (name: string, options: CaptureInterviewOptions = {}) => {
      if (!isCI) return;
      if (!stylesInjected) {
        await page.addStyleTag({ content: VISUAL_STYLES });
        stylesInjected = true;
      }
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
