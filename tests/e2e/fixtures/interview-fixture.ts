import { type Page, type Locator, expect } from '@playwright/test';

type CaptureInterviewFn = (name: string) => Promise<void>;

/**
 * Interview fixture for e2e tests.
 *
 * Handles interview shell and navigation concerns.
 * Use the `stage` fixture for stage-specific interactions.
 *
 * Screenshots are captured automatically by `goto()` when a capture function is set.
 */
export class InterviewFixture {
  readonly page: Page;
  private captureFn: CaptureInterviewFn | null = null;

  /**
   * The interview ID. Must be set before using navigation methods.
   * Typically set in beforeEach after creating the interview in beforeAll.
   */
  interviewId = '';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Set the capture function for automatic screenshots.
   * Called by the interview-test fixture to wire up captureInterview.
   */
  setCaptureFn(fn: CaptureInterviewFn): void {
    this.captureFn = fn;
  }

  /**
   * Manually capture a screenshot with the given name.
   * Useful in afterEach hooks to capture end state.
   */
  async capture(name: string): Promise<void> {
    if (this.captureFn) {
      await this.captureFn(name);
    }
  }

  /**
   * Navigate directly to a stage by index.
   * Automatically captures a screenshot after loading if a capture function is set.
   *
   * @param stageIndex - The 0-based stage index
   */
  async goto(stageIndex: number): Promise<void> {
    if (!this.interviewId) {
      throw new Error(
        'interviewId must be set before calling goto(). Set it in beforeEach.',
      );
    }

    await this.page.goto(`/interview/${this.interviewId}?step=${stageIndex}`);
    await this.waitForStageLoad();

    // Capture screenshot after stage load
    if (this.captureFn) {
      await this.captureFn(`stage-${stageIndex}`);
    }
  }

  /**
   * Locator for the next button.
   */
  get nextButton(): Locator {
    return this.page.getByTestId('next-button');
  }

  /**
   * Check if the next button has the pulse animation.
   * The pulse indicates validation has been satisfied.
   */
  async nextButtonHasPulse(): Promise<boolean> {
    const className = await this.nextButton.getAttribute('class');
    return className?.includes('animate-pulse-glow') ?? false;
  }

  /**
   * Wait for the interview stage to be fully loaded.
   */
  private async waitForStageLoad(): Promise<void> {
    // Wait for the interview container to be visible
    // The interview layout renders <main data-interview>
    const mainLocator = this.page.locator('main[data-interview]');

    try {
      await expect(mainLocator).toBeVisible({ timeout: 15000 });
    } catch (error) {
      // Capture diagnostic info on failure
      const url = this.page.url();
      const title = await this.page.title();
      const bodyText = await this.page
        .locator('body')
        .textContent()
        .catch(() => 'N/A');

      const diagnostics = [
        `Interview stage load failed`,
        `URL: ${url}`,
        `Title: ${title}`,
        `Body content (truncated): ${bodyText?.slice(0, 500) ?? 'empty'}`,
      ].join('\n');

      throw new Error(`${diagnostics}\n\nOriginal error: ${String(error)}`);
    }
  }
}
