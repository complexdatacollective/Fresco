import { test as authTest } from './auth';

// Export the most comprehensive test (includes auth + database)
export const test = authTest;
export { expect } from '@playwright/test';

