import { test as base, expect, type Locator } from '@playwright/test';
import { getContext, getSuiteId } from '../helpers/context.js';
import { TestDatabase } from '../helpers/testDatabase.js';
import { AppFixture } from './app-fixture.js';

// NOTE: Keep in sync with --breakpoint-* values in styles/globals.css
const DEFAULT_PAGE_VIEWPORTS = [
  { name: 'phone', width: 320 },
  { name: 'tablet-portrait', width: 768 },
  { name: 'tablet-landscape', width: 1024 },
  { name: 'laptop', width: 1280 },
  { name: 'desktop', width: 1536 },
  { name: 'desktop-lg', width: 1920 },
  { name: 'desktop-xl', width: 2560 },
] as const;

export const VISUAL_STYLES = `
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
  [data-testid="time-ago"] {
    color: transparent !important;
    display: inline-block !important;
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    vertical-align: middle !important;
  }
  td:has([data-testid="time-ago"]) {
    width: 96px !important;
    min-width: 96px !important;
    max-width: 96px !important;
  }
`;

const FULL_PAGE_STYLES = `
  .root { height: auto !important; min-height: 100dvh !important; }
  .root > * { min-height: 0 !important; }
  [data-testid="dashboard-layout"] {
    height: auto !important;
    min-height: 100dvh !important;
    overflow-y: visible !important;
  }
`;

type Viewport = {
  name: string;
  width: number;
};

type CapturePageOptions = {
  viewports?: Viewport[];
  mask?: Locator[];
};

type CaptureElementOptions = {
  mask?: Locator[];
};

type TestFixtures = {
  capturePage: (name: string, options?: CapturePageOptions) => Promise<void>;
  captureElement: (
    element: Locator,
    name: string,
    options?: CaptureElementOptions,
  ) => Promise<void>;
};

type WorkerFixtures = {
  database: TestDatabase;
  app: AppFixture;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      const projectName = workerInfo.project.name;
      const suiteId = getSuiteId(projectName);
      const context = await getContext(suiteId);
      const db = TestDatabase.fromConnectionUri(context.databaseUrl, suiteId);
      await use(db);
    },
    { scope: 'worker' },
  ],

  app: [
    async ({ database }, use) => {
      const app = new AppFixture(database.prisma);
      await use(app);
    },
    { scope: 'worker' },
  ],

  capturePage: [
    async ({ page }, use, testInfo) => {
      // eslint-disable-next-line no-process-env
      if (!process.env.CI) {
        testInfo.skip(true, 'Visual snapshots only run in Docker');
      }

      await use(async (name: string, options: CapturePageOptions = {}) => {
        const viewports = options.viewports ?? DEFAULT_PAGE_VIEWPORTS;
        const originalViewport = page.viewportSize();

        await page.addStyleTag({ content: VISUAL_STYLES });
        await page.addStyleTag({ content: FULL_PAGE_STYLES });

        // Wait for NoSSR-wrapped components (e.g. TimeAgo) to hydrate
        // before capturing. Without this, td:has([data-testid="time-ago"])
        // doesn't match because the <time> element hasn't mounted yet,
        // producing inconsistent column widths across runs.
        await page
          .locator('[data-testid="time-ago"]')
          .first()
          .waitFor({ state: 'attached', timeout: 2000 })
          .catch(() => {
            // Page may not have time-ago elements — that's fine
          });

        for (const viewport of viewports) {
          await page.setViewportSize({ width: viewport.width, height: 1080 });

          await expect(page).toHaveScreenshot(`${name}-${viewport.name}.png`, {
            fullPage: true,
            mask: options.mask,
          });
        }

        if (originalViewport) {
          await page.setViewportSize(originalViewport);
        }
      });
    },
    { scope: 'test' },
  ],

  captureElement: [
    async ({ page }, use, testInfo) => {
      // eslint-disable-next-line no-process-env
      if (!process.env.CI) {
        testInfo.skip(true, 'Visual snapshots only run in Docker');
      }

      await use(
        async (
          element: Locator,
          name: string,
          options: CaptureElementOptions = {},
        ) => {
          await page.addStyleTag({ content: VISUAL_STYLES });

          // Use page-level screenshot clipped to element bbox. The native
          // expect(element).toHaveScreenshot() runs a getBoundingClientRect
          // stability check that WebKit can never pass for fixed-position
          // elements with translate(-50%, -50%) — subpixel rounding causes
          // the bbox to oscillate between frames indefinitely.
          const box = await element.boundingBox();
          if (!box) {
            throw new Error(
              `captureElement(${name}): element has no bounding box`,
            );
          }

          await expect(page).toHaveScreenshot(`${name}.png`, {
            clip: box,
            mask: options.mask,
          });
        },
      );
    },
    { scope: 'test' },
  ],
});

export { expect };
