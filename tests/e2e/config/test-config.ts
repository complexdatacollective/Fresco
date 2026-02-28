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
