// tests/e2e/utils/visual/helpers.ts
import { type Page, type Locator, expect } from '@playwright/test';
import {
  type VisualTestConfig,
  defaultVisualConfig,
  commonMasks,
} from './config';

export class VisualTestHelper {
  private page: Page;
  private config: VisualTestConfig;

  constructor(page: Page, config: VisualTestConfig = defaultVisualConfig) {
    this.page = page;
    this.config = config;
  }

  /**
   * Wait for page to be ready for screenshot
   */
  async waitForScreenshotReady(): Promise<void> {
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');

    // Wait for fonts to load
    await this.page.waitForFunction(() => document.fonts.ready);

    // Set up page styles for consistent screenshots
    await this.setupPageStyles();

    // Clear storage if needed
    await this.clearStorage();

    // Wait a moment for rendering to stabilize
    await this.page.waitForTimeout(500);
  }

  /**
   * Take a screenshot of the entire page
   */
  async screenshotPage(
    name: string,
    options?: Partial<VisualTestConfig>,
  ): Promise<void> {
    const config = { ...this.config, ...options };

    await this.waitForScreenshotReady();

    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: config.fullPage,
      threshold: config.threshold,
      maxDiffPixels: config.maxDiffPixels,
      mask: [
        ...commonMasks.map((selector) => this.page.locator(selector)),
        ...(config.mask ? config.mask.map((selector) => this.page.locator(selector)) : []),
      ],
      clip: config.clip,
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async screenshotElement(
    selector: string,
    name: string,
    options?: Partial<VisualTestConfig>,
  ): Promise<void> {
    const config = { ...this.config, ...options };
    const element = this.page.locator(selector);

    await this.waitForScreenshotReady();
    await element.waitFor({ state: 'visible' });

    await expect(element).toHaveScreenshot(`${name}.png`, {
      threshold: config.threshold,
      maxDiffPixels: config.maxDiffPixels,
      mask: [
        ...commonMasks.map((selector) => this.page.locator(selector)),
        ...(config.mask ? config.mask.map((sel) => this.page.locator(sel)) : []),
      ],
    });
  }

  /**
   * Take screenshots at multiple viewport sizes
   */
  async screenshotResponsive(
    name: string,
    viewports: { name: string; width: number; height: number }[],
  ): Promise<void> {
    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await this.waitForScreenshotReady();

      await expect(this.page).toHaveScreenshot(
        `${name}-${viewport.name}.png`,
        {
          fullPage: this.config.fullPage,
          threshold: this.config.threshold,
          maxDiffPixels: this.config.maxDiffPixels,
          mask: [
            ...commonMasks.map((selector) => this.page.locator(selector)),
            ...(this.config.mask ? this.config.mask.map((selector) => this.page.locator(selector)) : []),
          ],
        },
      );
    }
  }

  /**
   * Mask dynamic content before taking screenshot
   */
  async maskDynamicContent(additionalMasks: string[] = []): Promise<void> {
    const allMasks = [...commonMasks, ...additionalMasks];

    for (const mask of allMasks) {
      try {
        const elements = this.page.locator(mask);
        const count = await elements.count();

        for (let i = 0; i < count; i++) {
          await elements.nth(i).evaluate((el) => {
            (el as HTMLElement).style.visibility = 'hidden';
          });
        }
      } catch (error) {
        // Ignore if selector doesn't exist
      }
    }
  }

  /**
   * Wait for specific elements to be loaded before screenshot
   */
  async waitForElements(selectors: string[]): Promise<void> {
    const promises = selectors.map((selector) =>
      this.page
        .locator(selector)
        .waitFor({ state: 'visible' })
        .catch(() => {
          // Ignore if element doesn't exist
        }),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Set up consistent state for visual testing
   */
  async setupVisualTestState(): Promise<void> {
    // Set fixed date for consistent timestamps
    await this.page.addInitScript(() => {
      const mockDate = new Date('2024-01-01T12:00:00Z');
      Date.now = () => mockDate.getTime();

      // Mock other time-sensitive functions
      Object.defineProperty(window, 'performance', {
        value: {
          ...window.performance,
          now: () => 0,
        },
      });
    });
  }

  /**
   * Clear browser storage after navigation
   */
  async clearStorage(): Promise<void> {
    try {
      await this.page.evaluate(() => {
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      });
    } catch (error) {
      // Ignore localStorage errors - might not be available on all pages
    }
  }

  /**
   * Set up page styles for consistent visual testing
   */
  async setupPageStyles(): Promise<void> {
    // Disable animations and ensure consistent rendering
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Hide scroll bars for consistent screenshots */
        ::-webkit-scrollbar {
          display: none !important;
        }
        
        /* Ensure consistent font rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          font-variant-ligatures: none;
        }
        
        /* Hide animated BackgroundBlobs component during visual tests */
        canvas[data-testid="background-blobs"],
        canvas:has([data-testid="background-blobs"]) {
          display: none !important;
        }
      `,
    });
  }

  /**
   * Compare screenshots with custom configuration
   */
  async compareScreenshot(
    locator: Locator | Page,
    name: string,
    options?: {
      threshold?: number;
      maxDiffPixels?: number;
      mask?: Locator[];
      clip?: { x: number; y: number; width: number; height: number };
    },
  ): Promise<void> {
    await this.waitForScreenshotReady();

    if ('url' in locator) {
      // It's a Page
      await expect(locator).toHaveScreenshot(`${name}.png`, options);
    } else {
      // It's a Locator
      await expect(locator).toHaveScreenshot(`${name}.png`, options);
    }
  }
}