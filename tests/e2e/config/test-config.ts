/* eslint-disable no-process-env */
import { type BrowserContext, type Page, devices } from '@playwright/test';

type BrowserConfig = {
  name: string;
  device: (typeof devices)[string];
};

const ALL_BROWSERS: BrowserConfig[] = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

function getActiveBrowsers(): BrowserConfig[] {
  const filter = process.env.E2E_BROWSERS;
  if (!filter) return ALL_BROWSERS;
  const names = filter.split(',').map((s) => s.trim());
  const filtered = ALL_BROWSERS.filter((b) => names.includes(b.name));
  return filtered.length > 0 ? filtered : ALL_BROWSERS;
}

const ENVIRONMENT_CHAIN = [
  { id: 'setup', testMatch: '**/setup/*.spec.ts', needsAuth: false },
  { id: 'auth', testMatch: '**/auth/*.spec.ts', needsAuth: false },
  { id: 'dashboard', testMatch: '**/dashboard/*.spec.ts', needsAuth: true },
  { id: 'api', testMatch: '**/api/*.spec.ts', needsAuth: false },
  {
    id: 'interview',
    testMatch: '**/interview/**/*.spec.ts',
    needsAuth: false,
  },
  { id: 'preview', testMatch: '**/preview/**/*.spec.ts', needsAuth: false },
] as const;

export function envUrlVar(browserName: string): string {
  return `E2E_${browserName.toUpperCase()}_URL`;
}

function authStatePath(browserName: string): string {
  return `./tests/e2e/.auth/${browserName}.json`;
}

export function authStatePathForProject(projectName: string): string {
  const lastDash = projectName.lastIndexOf('-');
  const browserName = projectName.substring(lastDash + 1);
  return authStatePath(browserName);
}

export function getEnvironmentInstances(): { suiteId: string }[] {
  return getActiveBrowsers().map((browser) => ({
    suiteId: browser.name,
  }));
}

export function getProjects(): {
  name: string;
  testMatch: string;
  dependencies?: string[];
  use: Record<string, unknown>;
}[] {
  return getActiveBrowsers().flatMap((browser) => {
    const baseURL = process.env[envUrlVar(browser.name)];
    let previousProjectName: string | undefined;

    return ENVIRONMENT_CHAIN.map((env) => {
      const projectName = `${env.id}-${browser.name}`;
      const dependencies = previousProjectName
        ? [previousProjectName]
        : undefined;

      previousProjectName = projectName;

      const use: Record<string, unknown> = {
        ...browser.device,
        baseURL,
      };

      if (env.needsAuth) {
        use.storageState = authStatePath(browser.name);
      }

      return {
        name: projectName,
        testMatch: env.testMatch,
        ...(dependencies && { dependencies }),
        use,
      };
    });
  });
}

export function getContextMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};
  for (const browser of getActiveBrowsers()) {
    for (const env of ENVIRONMENT_CHAIN) {
      mappings[`${env.id}-${browser.name}`] = browser.name;
    }
  }
  return mappings;
}

export async function saveAuthState(
  pageOrContext: Page | BrowserContext,
  statePath: string,
): Promise<void> {
  const context =
    'context' in pageOrContext ? pageOrContext.context() : pageOrContext;
  await context.storageState({ path: statePath });
}
