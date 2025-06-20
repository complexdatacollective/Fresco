// tests/e2e/fixtures/component-visual.ts
import { test as visualTest } from './visual';

type ComponentVisualFixtures = {
  screenshotComponent: (selector: string, name: string) => Promise<void>;
  screenshotTable: (name: string) => Promise<void>;
  screenshotModal: (name: string) => Promise<void>;
  screenshotForm: (selector: string, name: string) => Promise<void>;
  screenshotNavigation: (name: string) => Promise<void>;
};

export const test = visualTest.extend<ComponentVisualFixtures>({
  screenshotComponent: async ({ visualHelper }, provideScreenshotComponent) => {
    const screenshotComponent = async (selector: string, name: string) => {
      await visualHelper.screenshotElement(selector, name);
    };
    await provideScreenshotComponent(screenshotComponent);
  },

  screenshotTable: async ({ visualHelper }, provideScreenshotTable) => {
    const screenshotTable = async (name: string) => {
      const tableSelector = '[data-testid="data-table"]';
      await visualHelper.waitForElements([tableSelector]);
      await visualHelper.screenshotElement(tableSelector, `table-${name}`);
    };
    await provideScreenshotTable(screenshotTable);
  },

  screenshotModal: async ({ visualHelper }, provideScreenshotModal) => {
    const screenshotModal = async (name: string) => {
      const modalSelector = '[data-testid="modal"]';
      await visualHelper.waitForElements([modalSelector]);
      await visualHelper.screenshotElement(modalSelector, `modal-${name}`);
    };
    await provideScreenshotModal(screenshotModal);
  },

  screenshotForm: async ({ visualHelper }, provideScreenshotForm) => {
    const screenshotForm = async (selector: string, name: string) => {
      await visualHelper.waitForElements([selector]);
      await visualHelper.screenshotElement(selector, `form-${name}`);
    };
    await provideScreenshotForm(screenshotForm);
  },

  screenshotNavigation: async (
    { visualHelper },
    provideScreenshotNavigation,
  ) => {
    const screenshotNavigation = async (name: string) => {
      const navSelector = '[data-testid="navigation-bar"]';
      await visualHelper.waitForElements([navSelector]);
      await visualHelper.screenshotElement(navSelector, `nav-${name}`);
    };
    await provideScreenshotNavigation(screenshotNavigation);
  },
});
