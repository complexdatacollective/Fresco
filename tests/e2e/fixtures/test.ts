import {
  test as base,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import { getContextMappings } from '../config/test-config.js';
import { loadContext, type SuiteContext } from '../helpers/context.js';
import { DatabaseIsolation } from './db-fixture.js';

/**
 * Default timeout for URL navigation assertions (toHaveURL).
 * CI environments may be slower, so we use a longer timeout than the default 5s.
 */
const URL_ASSERTION_TIMEOUT = 15_000;

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

const VISUAL_STYLES = `
  *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }
  [data-testid="background-blobs"] { visibility: hidden !important; }
  [data-testid="time-ago"] { color: transparent !important; display: inline-block !important; width: 8ch !important; overflow: hidden !important; }
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
      const projectName = workerInfo.project.name;
      const mappings = getContextMappings();
      const suiteId = mappings[projectName];
      if (!suiteId) {
        throw new Error(
          `No context mapping for project "${projectName}". Available: ${Object.keys(mappings).join(', ')}`,
        );
      }
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
        await page.addStyleTag({ content: FULL_PAGE_STYLES });

        for (const viewport of viewports) {
          await page.setViewportSize({ width: viewport.width, height: 1080 });

          await page.waitForTimeout(500);

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

          // Wait for Base UI opening animations to complete.
          // WebKit is slower to remove `data-starting-style`, causing
          // Playwright's stability check to fail when the attribute
          // toggles between consecutive screenshots.
          await element.evaluate((el) => {
            return new Promise<void>((resolve) => {
              if (!el.hasAttribute('data-starting-style')) {
                resolve();
                return;
              }

              const observer = new MutationObserver(() => {
                if (!el.hasAttribute('data-starting-style')) {
                  observer.disconnect();
                  resolve();
                }
              });
              observer.observe(el, { attributes: true });
            });
          });

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

/**
 * Assert that the page URL matches the given pattern.
 *
 * IMPORTANT: Always use this helper instead of `expect(page).toHaveURL()` directly.
 * This ensures consistent timeout handling across all tests, especially in CI
 * environments where navigation may be slower.
 *
 * Uses URL_ASSERTION_TIMEOUT (15s) as the default timeout.
 *
 * @example
 * await expectURL(page, /\/dashboard\/protocols/);
 * await expectURL(page, '/dashboard/settings');
 * await expectURL(page, /\/interviews\/\d+/, { timeout: 30_000 }); // custom timeout
 */
export async function expectURL(
  page: Page,
  urlOrRegex: string | RegExp,
  options?: { timeout?: number },
) {
  await expect(page).toHaveURL(urlOrRegex, {
    timeout: options?.timeout ?? URL_ASSERTION_TIMEOUT,
  });
}
