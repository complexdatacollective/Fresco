import type {
  TestEnvironment,
  TestEnvironmentContext,
} from '../fixtures/test-environment';

type TestDataUser = {
  id: string;
  username: string;
};

type TestDataProtocol = {
  id: string;
  name: string;
};

type TestDataParticipant = {
  id: string;
  identifier: string;
  label: string;
};

declare global {
  namespace globalThis {
    // eslint-disable-next-line no-var
    var __TEST_ENVIRONMENT__: TestEnvironment | undefined;
    // eslint-disable-next-line no-var
    var __SETUP_CONTEXT__: TestEnvironmentContext | undefined;
    // eslint-disable-next-line no-var
    var __DASHBOARD_CONTEXT__: TestEnvironmentContext | undefined;
    // eslint-disable-next-line no-var
    var __INTERVIEWS_CONTEXT__: TestEnvironmentContext | undefined;
    // eslint-disable-next-line no-var
    var __INTERVIEW_CONTEXT__: TestEnvironmentContext | undefined;
    // eslint-disable-next-line no-var
    var __INTERVIEWS_TEST_DATA__:
      | {
          admin: TestDataUser;
          protocol: TestDataProtocol;
          participants: TestDataParticipant[];
        }
      | undefined;
  }
}

export {};
