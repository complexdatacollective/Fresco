/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';

type UserData = {
  username?: string;
};

type ProtocolData = {
  name?: string;
  schemaVersion?: number;
  stages?: unknown[];
  [key: string]: unknown;
};

type InterviewData = {
  protocolId?: string;
  participantId?: string;
  [key: string]: unknown;
};

// Define custom fixtures for your tests
type TestFixtures = {
  testUser: {
    username: string;
    password: string;
  };
  apiHelper: {
    resetDatabase: () => Promise<void>;
    createUser: (data?: UserData) => Promise<unknown>;
    createProtocol: (data?: ProtocolData) => Promise<unknown>;
    createInterview: (data?: InterviewData) => Promise<unknown>;
  };
};

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    // Provide test user credentials
    await use({
      username: 'testuser@example.com',
      password: 'TestPassword123!',
    });
  },

  apiHelper: async ({ baseURL }, use) => {
    const helper = {
      resetDatabase: async () => {
        const response = await fetch(`${baseURL}/api/test/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' }),
        });
        if (!response.ok) {
          throw new Error(`Failed to reset database: ${response.statusText}`);
        }
        await response.json();
      },

      createUser: async (data = {}) => {
        const response = await fetch(`${baseURL}/api/test/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createUser',
            data: {
              username: 'testuser@example.com',
              ...data,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to create user: ${response.statusText}`);
        }
        return response.json();
      },

      createProtocol: async (data = {}) => {
        const response = await fetch(`${baseURL}/api/test/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createProtocol',
            data: {
              name: 'Test Protocol',
              schemaVersion: 8,
              ...data,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to create protocol: ${response.statusText}`);
        }
        return response.json();
      },

      createInterview: async (data = {}) => {
        const response = await fetch(`${baseURL}/api/test/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createInterview',
            data,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to create interview: ${response.statusText}`);
        }
        return response.json();
      },
    };

    await use(helper);
  },
});

export { expect };
