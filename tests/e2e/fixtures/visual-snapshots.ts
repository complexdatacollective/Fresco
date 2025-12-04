/* cSpell:ignore networkidle domcontentloaded */
import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Configuration options for visual snapshots
 */
export type VisualSnapshotOptions = {
  /** Name of the snapshot file (without extension) */
  name: string;
  /** Threshold for pixel differences (0.0 to 1.0) */
  threshold?: number;
  /** Maximum allowed pixel difference */
  maxDiffPixels?: number;
  /** Animation handling - 'disable' | 'allow' */
  animations?: 'disable' | 'allow';
  /** Whether to take a full page screenshot */
  fullPage?: boolean;
  /** Additional wait time before taking screenshot */
  waitTime?: number;
  /** CSS selector to wait for before taking screenshot */
  waitForSelector?: string;
  /** Custom viewport size for this snapshot */
  viewport?: { width: number; height: number };
  /** Mask certain elements (selectors) */
  mask?: string[];
  /** Clip to specific area */
  clip?: { x: number; y: number; width: number; height: number };
};

/**
 * Visual snapshot helper class for consistent screenshot testing
 */
export class VisualSnapshots {
  constructor(private page: Page) {}

  /**
   * Take a page screenshot and compare it to the baseline
   */
  async expectPageToMatchSnapshot(
    options: VisualSnapshotOptions,
  ): Promise<void> {
    await this.preparePageForSnapshot(options);

    const screenshotOptions = this.buildScreenshotOptions(options);

    // Take screenshot and compare to baseline
    await expect(this.page).toHaveScreenshot(`${options.name}.png`, {
      threshold: options.threshold ?? 0.1,
      maxDiffPixels: options.maxDiffPixels ?? 100,
      fullPage: screenshotOptions.fullPage,
      animations: screenshotOptions.animations,
      clip: screenshotOptions.clip,
      mask: screenshotOptions.mask,
    });
  }

  /**
   * Take an element screenshot and compare it to the baseline
   */
  async expectElementToMatchSnapshot(
    locator: Locator,
    options: VisualSnapshotOptions,
  ): Promise<void> {
    await this.preparePageForSnapshot(options);

    // Wait for element to be visible
    await expect(locator).toBeVisible();

    // Take element screenshot and compare to baseline
    await expect(locator).toHaveScreenshot(`${options.name}.png`, {
      threshold: options.threshold ?? 0.1,
      maxDiffPixels: options.maxDiffPixels ?? 100,
      animations: options.animations === 'allow' ? 'allow' : 'disabled',
    });
  }

  /**
   * Create a baseline screenshot (usually run with --update-snapshots)
   */
  async createBaseline(options: VisualSnapshotOptions): Promise<void> {
    await this.preparePageForSnapshot(options);

    const screenshotOptions = this.buildScreenshotOptions(options);

    // This will create the baseline when run with --update-snapshots
    await expect(this.page).toHaveScreenshot(`${options.name}.png`, {
      fullPage: screenshotOptions.fullPage,
      animations: screenshotOptions.animations,
      clip: screenshotOptions.clip,
      mask: screenshotOptions.mask,
    });
  }

  /**
   * Prepare page for consistent snapshot taking
   */
  private async preparePageForSnapshot(
    options: VisualSnapshotOptions,
  ): Promise<void> {
    await this.waitForStablePage();

    // Set custom viewport if specified
    if (options.viewport) {
      await this.page.setViewportSize(options.viewport);
    }

    // Disable animations by default for consistent snapshots
    if (options.animations !== 'allow') {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            scroll-behavior: auto !important;
          }
        `,
      });
    }

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      await this.page.waitForSelector(options.waitForSelector, {
        timeout: 10000,
      });
    }

    // Wait for network idle to ensure all resources are loaded (with timeout fallback)
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Network idle timeout is acceptable - Next.js apps often have persistent connections
    }

    // Additional wait time if specified
    if (options.waitTime) {
      await this.page.waitForTimeout(options.waitTime);
    }

    // Hide dynamic content that might cause flaky tests
    await this.hideDynamicContent();

    // Mask specified elements
    if (options.mask) {
      for (const selector of options.mask) {
        await this.page
          .locator(selector)
          .first()
          .evaluate((el) => {
            (el as HTMLElement).style.visibility = 'hidden';
          })
          .catch(() => {
            // Ignore if selector doesn't exist
          });
      }
    }
  }

  /**
   * Hide common dynamic content that causes flaky visual tests
   */
  private async hideDynamicContent(): Promise<void> {
    // Hide common dynamic elements
    const dynamicSelectors = [
      '[data-testid*="timestamp"]',
      '[data-testid*="time"]',
      '.timestamp',
      '.time-ago',
      '.relative-time',
      // Add more selectors as needed
    ];

    for (const selector of dynamicSelectors) {
      try {
        await this.page.locator(selector).evaluateAll((elements) => {
          elements.forEach((el) => {
            (el as HTMLElement).style.visibility = 'hidden';
          });
        });
      } catch {
        // Ignore if selector doesn't exist
      }
    }

    // Replace dynamic text content
    await this.page.evaluate(() => {
      // Replace any timestamp-like content with placeholder
      const timestampRegex =
        /\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}:\d{2}:\d{2}|\d+ (seconds?|minutes?|hours?|days?) ago/g;
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
      );

      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      textNodes.forEach((textNode) => {
        if (textNode.textContent && timestampRegex.test(textNode.textContent)) {
          textNode.textContent = textNode.textContent.replace(
            timestampRegex,
            '[TIMESTAMP]',
          );
        }
      });
    });
  }

  /**
   * Build screenshot options for Playwright
   */
  private buildScreenshotOptions(options: VisualSnapshotOptions) {
    const animations: 'allow' | 'disabled' =
      options.animations === 'allow' ? 'allow' : 'disabled';
    return {
      fullPage: options.fullPage ?? false,
      animations,
      clip: options.clip,
      mask: options.mask
        ? options.mask.map((selector) => this.page.locator(selector))
        : undefined,
    };
  }

  /**
   * Utility method to wait for page to be stable
   */
  async waitForStablePage(timeout = 5000): Promise<void> {
    // Wait for DOM to be ready
    await this.page.waitForLoadState('domcontentloaded');

    // Try to wait for network idle, but don't fail if it times out
    // (Next.js apps often have persistent connections that prevent networkidle)
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      // Network idle timeout is acceptable - the page may have persistent connections
    }

    // Wait for any loading spinners to disappear
    const loadingSelectors = [
      '[data-testid*="loading"]',
      '[data-testid*="spinner"]',
      '.loading',
      '.spinner',
      '[aria-label*="loading" i]',
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, {
          state: 'detached',
          timeout: 2000,
        });
      } catch {
        // Ignore if selector doesn't exist or timeout
      }
    }

    // Final small wait for any animations to complete
    await this.page.waitForTimeout(500);
  }
}

/**
 * Predefined snapshot configurations for common use cases
 */
export const SNAPSHOT_CONFIGS = {
  // Standard page snapshot
  page: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.1,
    maxDiffPixels: 100,
    fullPage: false,
    animations: 'disable',
    waitTime: 1000,
  }),

  // Full page snapshot
  fullPage: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.1,
    maxDiffPixels: 200,
    fullPage: true,
    animations: 'disable',
    waitTime: 1000,
  }),

  // Component snapshot (for specific elements)
  component: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.05,
    maxDiffPixels: 50,
    animations: 'disable',
    waitTime: 500,
  }),

  // Table/data grid snapshot
  table: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.1,
    maxDiffPixels: 100,
    animations: 'disable',
    waitTime: 1000,
    waitForSelector: 'table, [role="table"], [data-testid*="table"]',
  }),

  // Modal/dialog snapshot
  modal: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.05,
    maxDiffPixels: 50,
    animations: 'disable',
    waitTime: 500,
    waitForSelector: '[role="dialog"], [role="modal"], .modal',
  }),

  // Empty state snapshot
  emptyState: (name: string): VisualSnapshotOptions => ({
    name,
    threshold: 0.1,
    maxDiffPixels: 100,
    animations: 'disable',
    waitTime: 2000, // Longer wait to ensure empty state is rendered
  }),
} as const;
