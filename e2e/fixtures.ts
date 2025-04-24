// fixtures.ts
import type { NcEdge } from '@codaco/shared-consts';
import { test as base, type Page } from '@playwright/test';
import type {
  ReduxStore as OriginalReduxStore,
  SessionsState,
} from '../lib/interviewer/store';

type ReduxFixtures = {
  getReduxState: (page: Page) => Promise<ReduxStore | undefined>;
  getSessionState: (page: Page) => Promise<SessionsState | undefined>;
  getSessionEdges: (page: Page) => Promise<NcEdge[]>;
};

// todo: this shouldn't be necessary
type ReduxStore = {
  sessions: SessionsState;
} & OriginalReduxStore;

export const testWithStore = base.extend<ReduxFixtures>({
  getReduxState: async ({ context }, playwrightUse) => {
    // set flag to add redux store to window
    await context.addInitScript('window.IS_PLAYWRIGHT = true;');

    await playwrightUse(async (page: Page) => {
      return page.evaluate(() => {
        return window.REDUX_STORE?.getState() as ReduxStore | undefined;
      });
    });
  },

  getSessionState: async ({ getReduxState }, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const state = await getReduxState(page);
      if (!state) {
        throw new Error('Redux state is undefined');
      }
      return state?.sessions as SessionsState | undefined;
    });
  },

  getSessionEdges: async ({ getSessionState }, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const sessions = await getSessionState(page);

      if (!sessions) {
        throw new Error('Sessions state is undefined');
      }

      const sessionKey = Object.keys(sessions)[0];
      if (!sessionKey) {
        throw new Error('Session key is undefined');
      }

      const session = sessions[sessionKey];
      return session?.network?.edges ?? [];
    });
  },
});
