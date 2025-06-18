import { test as authTest } from './auth';
import { test as dbTest } from './database';

// Export the most comprehensive test (includes auth + database)
export const test = authTest;
export { expect } from '@playwright/test';

// Export individual test types for specific use cases
export { test as dbTest } from './database';
export { test as authTest } from './auth';