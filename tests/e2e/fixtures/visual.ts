// tests/e2e/fixtures/visual.ts
import {
  defaultVisualConfig,
  fullPageVisualConfig,
  strictVisualConfig,
  defaultViewport,
} from '~/tests/e2e/utils/visual/config';
import { VisualTestHelper } from '~/tests/e2e/utils/visual/helpers';
import { test as pageTest } from './index';

type VisualFixtures = {
  visualHelper: VisualTestHelper;
  visualHelperStrict: VisualTestHelper;
  visualHelperFullPage: VisualTestHelper;
  // visualHelperMobile: VisualTestHelper;
  setupVisualTest: () => Promise<void>;
};

export const test = pageTest.extend<VisualFixtures>({
  // Default visual helper
  visualHelper: async ({ page }, provideHelper) => {
    const helper = new VisualTestHelper(page, defaultVisualConfig);
    await helper.setupVisualTestState();
    await provideHelper(helper);
  },

  // Strict visual helper (lower tolerance)
  visualHelperStrict: async ({ page }, provideStrictHelper) => {
    const helper = new VisualTestHelper(page, strictVisualConfig);
    await helper.setupVisualTestState();
    await provideStrictHelper(helper);
  },

  // Full page visual helper
  visualHelperFullPage: async ({ page }, provideFullPageHelper) => {
    const helper = new VisualTestHelper(page, fullPageVisualConfig);
    await helper.setupVisualTestState();
    await provideFullPageHelper(helper);
  },

  // // Mobile visual helper
  // visualHelperMobile: async ({ page }, provideMobileHelper) => {
  //   await page.setViewportSize(viewports.mobile);
  //   const helper = new VisualTestHelper(page, mobileVisualConfig);
  //   await helper.setupVisualTestState();
  //   await provideMobileHelper(helper);
  // },

  // Setup function for visual tests
  setupVisualTest: async ({ page }, provideSetup) => {
    const setup = async () => {
      // Set consistent viewport
      await page.setViewportSize(defaultViewport);

      // Set up visual test state
      const helper = new VisualTestHelper(page);
      await helper.setupVisualTestState();
    };

    await provideSetup(setup);
  },
});
