import type { NcEdge, NcNetwork, NcNode } from '@codaco/shared-consts';
import { test as base, type Page } from '@playwright/test';
import type { SessionsState } from '../lib/interviewer/store';

type ReduxFixtures = {
  getSessionState: (page: Page) => Promise<SessionsState | undefined>;
  getSessionNetwork: (page: Page) => Promise<NcNetwork>;
  getSessionEdges: (page: Page) => Promise<NcEdge[]>;
  getSessionNodes: (page: Page) => Promise<NcNode[]>;
};

export const testWithStore = base.extend<ReduxFixtures>({
  // eslint-disable-next-line no-empty-pattern
  getSessionState: async ({}, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const state = await page.evaluate(() => {
        return window.REDUX_STORE?.getState();
      });

      if (!state) {
        throw new Error('Redux state is undefined');
      }

      return state.sessions as SessionsState | undefined;
    });
  },

  getSessionNetwork: async ({ getSessionState }, playwrightUse) => {
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
      if (!session?.network) {
        throw new Error('Network is undefined');
      }
      return session.network as NcNetwork;
    });
  },

  getSessionEdges: async ({ getSessionNetwork }, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const network = await getSessionNetwork(page);
      const edges = network?.edges;

      if (!edges) {
        throw new Error('No session edges found');
      }

      return edges;
    });
  },

  getSessionNodes: async ({ getSessionNetwork }, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const network = await getSessionNetwork(page);
      const nodes = network?.nodes;

      if (!nodes) {
        throw new Error('No session nodes found');
      }

      return nodes;
    });
  },
});
