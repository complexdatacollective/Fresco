import { test as authTest } from './auth';

// Export the most comprehensive test (includes auth + database)
export const test = authTest;

// Export functional test for Phase A testing
export { test as functionalTest } from './functional';

export { expect } from '@playwright/test';

