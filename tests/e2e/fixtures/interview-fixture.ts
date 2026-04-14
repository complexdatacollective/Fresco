import { type Locator, type Page, expect } from '@playwright/test';
import { expectURL } from '~/tests/e2e/helpers/expectations.js';

type CaptureOptions = {
  mask?: Locator[];
};

type CaptureInterviewFn = (
  name: string,
  options?: CaptureOptions,
) => Promise<void>;

/**
 * Interview fixture for e2e tests.
 *
 * Handles interview shell and navigation concerns.
 * Use the `stage` fixture for stage-specific interactions.
 */
export class InterviewFixture {
  readonly page: Page;
  private captureFn: CaptureInterviewFn | null = null;

  /**
   * The interview ID. Must be set before using navigation methods.
   * Typically set in beforeEach after creating the interview in beforeAll.
   */
  interviewId = '';

  /**
   * Optional prefix for screenshot names. Set this in beforeAll/beforeEach
   * to avoid snapshot name collisions between test files testing the same stages.
   */
  snapshotPrefix = '';

  /**
   * When true, afterEach hooks should skip calling next().
   * Set this in tests that call next() or finishInterview() themselves
   * (e.g. form stages with post-submit waits, or finish tests).
   */
  skipNext = false;

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
   * The snapshotPrefix is NOT automatically prepended - use the full name you want.
   */
  async capture(name: string, options?: CaptureOptions): Promise<void> {
    if (this.captureFn) {
      const resolvedOptions = this.resolveCaptureMasks(options);
      await this.captureFn(name, resolvedOptions);
    }
  }

  /**
   * Resolve capture options, always adding video masks.
   */
  private resolveCaptureMasks(options?: CaptureOptions): CaptureOptions {
    const videoLocator = this.page.locator('video');
    const existingMasks = options?.mask ?? [];

    return {
      ...options,
      mask: [...existingMasks, videoLocator],
    };
  }

  /**
   * Navigate directly to a stage by index.
   *
   * @param stageIndex - The 0-based stage index
   * @param options - Screenshot options and an optional `waitFor` locator
   *   that must be visible before the screenshot is taken (useful for stages
   *   with async rendering like Sociogram).
   */
  async goto(stageIndex: number): Promise<void> {
    if (!this.interviewId) {
      throw new Error(
        'interviewId must be set before calling goto(). Set it in beforeEach.',
      );
    }

    await this.page.goto(`/interview/${this.interviewId}?step=${stageIndex}`);
    await this.waitForStageLoad();
  }

  async captureInitial(): Promise<void> {
    if (!this.interviewId) {
      throw new Error(
        'interviewId must be set before calling goto(). Set it in beforeEach.',
      );
    }

    const stageIndex = this.getCurrentStep() ?? 'unknown';

    await this.waitForStageLoad();
    await this.waitForMapReadyIfPresent();
    await this.waitForSociogramSettledIfPresent();

    const prefix = this.snapshotPrefix ? `${this.snapshotPrefix}-` : '';
    await this.capture(`${prefix}stage-${stageIndex}`);
  }

  async captureFinal(): Promise<void> {
    const step = this.getCurrentStep();
    if (step) {
      // Tests may have interacted with the map/sociogram before the final
      // capture (panning, selecting nodes). Re-wait for idle so tile/label
      // rendering catches up before the screenshot, matching captureInitial.
      await this.waitForMapReadyIfPresent();
      await this.waitForSociogramSettledIfPresent();
      const prefix = this.snapshotPrefix ? `${this.snapshotPrefix}-` : '';
      await this.capture(`${prefix}stage-${step}-final`);
    }
  }

  // Geospatial stages render a Mapbox map that loads tiles and async
  // overlays (GeoJSON, transit) after mount. `data-map-idle` is set true
  // by the stage only once every layer it configured has rendered, so a
  // single wait is stage-agnostic.
  private async waitForMapReadyIfPresent(): Promise<void> {
    const mapContainer = this.page.getByTestId('map-container');
    if ((await mapContainer.count()) === 0) {
      return;
    }
    await expect(mapContainer).toHaveAttribute('data-map-idle', 'true', {
      timeout: 30000,
    });
  }

  // Sociogram stages with automaticLayout run a force simulation. In e2e
  // mode the worker is mocked with a deterministic grid layout (see
  // forceSimulation.worker.mock.ts) that emits `end` immediately, so this
  // wait settles on the next tick rather than after force convergence.
  private async waitForSociogramSettledIfPresent(): Promise<void> {
    const sociogram = this.page.getByTestId('sociogram');
    if ((await sociogram.count()) === 0) {
      return;
    }
    await expect(sociogram).toHaveAttribute(
      'data-simulation-running',
      'false',
      { timeout: 15000 },
    );
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
   * Capture the current stage's final state, then click next.
   * This is the standard way to end every stage test — it ensures
   * the filled/interacted state is screenshotted before navigation.
   */
  async next(): Promise<void> {
    const before = this.getCurrentStep();
    await this.nextButton.click();
    if (before !== null) {
      await this.page.waitForURL(
        (url) => {
          const match = /step=(\d+)/.exec(url.toString());
          return match ? match[1] !== before : false;
        },
        { timeout: 10_000 },
      );
    }
  }

  /**
   * Complete the FinishSession stage: click Finish, confirm the dialog,
   * and verify redirect to the finished page.
   *
   * Expects the page to already be on the FinishSession stage
   */
  async finishInterview(): Promise<void> {
    // Verify we're on the FinishSession stage
    await expect(
      this.page.getByRole('heading', { name: 'Finish Interview' }),
    ).toBeVisible();

    // Click the Finish button
    await this.page.getByRole('button', { name: 'Finish' }).click();

    // Confirmation dialog appears
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Confirm finish
    await dialog.getByRole('button', { name: 'Finish Interview' }).click();

    // Should redirect to finished page
    await expectURL(this.page, /\/interview\/finished/);
    await expect(
      this.page.getByRole('heading', { name: 'Thank you for participating!' }),
    ).toBeVisible();
  }

  /**
   * Extract the current step index from the page URL.
   */
  private getCurrentStep(): string | null {
    const match = /step=(\d+)/.exec(this.page.url());
    return match?.[1] ?? null;
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
