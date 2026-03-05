/* eslint-disable no-process-env */
import { type BrowserContext, type Page, devices } from '@playwright/test';
import {
  seedDashboardEnvironment,
  seedSetupEnvironment,
} from '../helpers/seed.js';

type BrowserConfig = {
  name: string;
  device: (typeof devices)[string];
};

type EnvironmentConfig = {
  id: string;
  testMatch: string;
  seed: (connectionUri: string) => Promise<void>;
  auth: boolean;
};

const ALL_BROWSERS: BrowserConfig[] = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

export function getActiveBrowsers(): BrowserConfig[] {
  const filter = process.env.E2E_BROWSERS;
  if (!filter) return ALL_BROWSERS;
  const names = filter.split(',').map((s) => s.trim());
  const filtered = ALL_BROWSERS.filter((b) => names.includes(b.name));
  return filtered.length > 0 ? filtered : ALL_BROWSERS;
}

export const ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: 'setup',
    testMatch: '**/setup/*.spec.ts',
    seed: seedSetupEnvironment,
    auth: false,
  },
  {
    id: 'dashboard',
    testMatch: '**/dashboard/*.spec.ts',
    seed: seedDashboardEnvironment,
    auth: true,
  },
];

export function envInstanceId(envId: string, browserName: string): string {
  return `${envId}-${browserName}`;
}

export function envUrlVar(instanceId: string): string {
  return `${instanceId.toUpperCase().replace(/-/g, '_')}_URL`;
}

export function authStatePath(envId: string, browserName: string): string {
  return `./tests/e2e/.auth/${envId}-${browserName}.json`;
}

export function authStatePathForProject(projectName: string): string {
  const instanceId = projectName.replace(/^auth-/, '');
  const lastDash = instanceId.lastIndexOf('-');
  const envId = instanceId.substring(0, lastDash);
  const browserName = instanceId.substring(lastDash + 1);
  return authStatePath(envId, browserName);
}

export function getEnvironmentInstances(): {
  suiteId: string;
  seed: (connectionUri: string) => Promise<void>;
}[] {
  return getActiveBrowsers().flatMap((browser) =>
    ENVIRONMENTS.map((env) => ({
      suiteId: envInstanceId(env.id, browser.name),
      seed: env.seed,
    })),
  );
}

export function getProjects(): {
  name: string;
  testMatch: string;
  dependencies?: string[];
  use: Record<string, unknown>;
}[] {
  return getActiveBrowsers().flatMap((browser) =>
    ENVIRONMENTS.flatMap((env) => {
      const projects = [];
      const instanceId = envInstanceId(env.id, browser.name);
      const baseURL = process.env[envUrlVar(instanceId)];

      if (env.auth) {
        projects.push({
          name: `auth-${instanceId}`,
          testMatch: '**/auth/*.spec.ts',
          use: {
            ...browser.device,
            baseURL,
          },
        });

        projects.push({
          name: instanceId,
          testMatch: env.testMatch,
          dependencies: [`auth-${instanceId}`],
          use: {
            ...browser.device,
            baseURL,
            storageState: authStatePath(env.id, browser.name),
          },
        });
      } else {
        projects.push({
          name: instanceId,
          testMatch: env.testMatch,
          use: {
            ...browser.device,
            baseURL,
          },
        });
      }

      return projects;
    }),
  );
}

export function getContextMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};
  for (const browser of getActiveBrowsers()) {
    for (const env of ENVIRONMENTS) {
      const instanceId = envInstanceId(env.id, browser.name);
      mappings[instanceId] = instanceId;
      if (env.auth) {
        mappings[`auth-${instanceId}`] = instanceId;
      }
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
