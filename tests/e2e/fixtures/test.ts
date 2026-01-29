import { test as base, expect, type Locator } from '@playwright/test';
import { loadContext, type SuiteContext } from '../helpers/context.js';
import { DatabaseIsolation } from './db-fixture.js';

// NOTE: Keep in sync with --breakpoint-* values in styles/globals.css
const DEFAULT_PAGE_VIEWPORTS = [
  { name: 'phone', width: 320, height: null }, // --breakpoint-phone: 20rem
  { name: 'tablet', width: 768, height: null }, // --breakpoint-tablet: 48rem
  { name: 'tablet-portrait', width: 1024, height: null }, // --breakpoint-tablet-portrait: 64rem
  { name: 'laptop', width: 1280, height: null }, // --breakpoint-laptop: 80rem
  { name: 'desktop', width: 1920, height: null }, // --breakpoint-desktop: 120rem
  { name: 'desktop-lg', width: 2560, height: null }, // --breakpoint-desktop-lg: 160rem
  { name: 'full', width: 1920, height: null }, // desktop width, fullPage: true
] as const;

const VISUAL_STYLES = `
  *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }
  [data-testid="background-blobs"] { visibility: hidden !important; }
`;

type Viewport = {
  name: string;
  width: number;
  height: number | null;
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
  database: DatabaseIsolation;
};

let contextCache: Record<string, SuiteContext> | null = null;

async function getContext(suiteId: string): Promise<SuiteContext> {
  if (!contextCache) {
    const stored = await loadContext();
    if (!stored) {
      throw new Error(
        'Test context not found. Did global-setup.ts run successfully?',
      );
    }
    contextCache = stored.suites;
  }

  const suite = contextCache[suiteId];
  if (!suite) {
    throw new Error(
      `Suite "${suiteId}" not found in test context. Available: ${Object.keys(contextCache).join(', ')}`,
    );
  }
  return suite;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  database: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      // Worker-scoped so it can be used in beforeAll hooks
      // Map project name to suite ID
      const projectName = workerInfo.project.name;
      const suiteId = projectName === 'setup' ? 'setup' : 'dashboard';
      const context = await getContext(suiteId);
      const db = new DatabaseIsolation(context.databaseUrl, suiteId);

      await use(db);
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

        for (const viewport of viewports) {
          const isFullHeight = viewport.height === null;
          const height = viewport.height ?? 800;

          await page.setViewportSize({ width: viewport.width, height });
          await page.waitForTimeout(100);

          await expect(page).toHaveScreenshot(`${name}-${viewport.name}.png`, {
            fullPage: isFullHeight,
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

          await expect(element).toHaveScreenshot(`${name}.png`, {
            mask: options.mask,
          });
        },
      );
    },
    { scope: 'test' },
  ],
});

export { expect };
