import { type BrowserContext, type Page } from '@playwright/test';

/**
 * Path to the saved admin auth state, relative to the project root.
 * Used by the auth project to save state and the dashboard project to load it.
 */
export const AUTH_STATE_PATH = './tests/e2e/.auth/admin.json';

/**
 * Save the current browser auth state (cookies, storage) to the shared auth file.
 * Call after login to persist state for the dashboard project.
 */
export async function saveAuthState(pageOrContext: Page | BrowserContext) {
  const context =
    'context' in pageOrContext ? pageOrContext.context() : pageOrContext;
  await context.storageState({ path: AUTH_STATE_PATH });
}

/**
 * Context mappings for test resolution
 * Maps test suite directories and Playwright project names to context identifiers
 */
export const CONTEXT_MAPPINGS = {
  // Maps suite directory names (tests/e2e/suites/<name>/) to context identifiers
  suiteToContext: {
    setup: 'setup',
    dashboard: 'dashboard',
    interview: 'interview',
    auth: 'dashboard',
  },
  // Maps Playwright project names to context identifiers
  projectToContext: {
    'setup': 'setup',
    'auth-dashboard': 'dashboard',
    'dashboard': 'dashboard',
    'interview': 'interview',
  },
} as const;
