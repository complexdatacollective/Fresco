/**
 * Global type definitions for e2e test environment
 */
/* eslint-disable no-var, @typescript-eslint/no-explicit-any */

import { type Protocol } from '@codaco/protocol-validation';
import type { User } from '~/lib/db/generated/client';
import type { TestEnvironment } from './tests/e2e/fixtures/test-environment';

declare global {
  namespace globalThis {
    var __TEST_ENVIRONMENT__: TestEnvironment | undefined;
    var __INTERVIEWS_TEST_DATA__:
      | {
          admin: {
            user: User;
            username: string;
            password: string;
          };
          protocol: Protocol;
          participants: any[];
        }
      | undefined;
    var __INTERVIEWS_CONTEXT__:
      | {
          restoreSnapshot: (name: string) => Promise<void>;
        }
      | undefined;
  }
}

export {};
