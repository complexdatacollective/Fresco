import type { NcEdge, NcNetwork, NcNode } from '@codaco/shared-consts';
import { test as base, type Page } from '@playwright/test';
import type { Session, SessionsState } from '~/lib/interviewer/store';

type ReduxFixtures = {
  getSession: (page: Page) => Promise<Session>;
  getSessionNetwork: (page: Page) => Promise<NcNetwork>;
  getSessionEdges: (page: Page) => Promise<NcEdge[]>;
  getSessionNodes: (page: Page) => Promise<NcNode[]>;
  waitForReduxState: (
    page: Page,
    predicate: (state: any) => boolean,
    options?: { timeout?: number },
  ) => Promise<void>;
  waitForNodeCount: (page: Page, count: number) => Promise<void>;
  waitForEdgeCount: (page: Page, count: number) => Promise<void>;
};

export const testWithStore = base.extend<ReduxFixtures>({
  getSession: async ({}, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const state = await page.evaluate(() => {
        return window.REDUX_STORE?.getState();
      });

      if (!state) {
        throw new Error('Redux state is undefined');
      }

      const sessions = state.sessions as SessionsState;

      const activeSession = state.activeSessionId as string;

      const session = sessions[activeSession];

      if (!sessions || !activeSession || !session) {
        throw new Error('No active session found');
      }

      return session;
    });
  },

  getSessionNetwork: async ({ getSession }, playwrightUse) => {
    await playwrightUse(async (page: Page) => {
      const session = await getSession(page);
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

  // New utility: Wait for Redux state to match a condition
  waitForReduxState: async ({}, playwrightUse) => {
    await playwrightUse(
      async (page: Page, predicate: (state: any) => boolean, options = {}) => {
        const { timeout = 10000 } = options;

        await page.waitForFunction(
          (predicateStr) => {
            const state = window.REDUX_STORE?.getState();
            if (!state) return false;

            // Create and execute the predicate function
            const fn = new Function('state', `return ${predicateStr}`);
            return fn(state);
          },
          predicate
            .toString()
            .replace(/^.*?=>/, '')
            .trim(),
          { timeout },
        );
      },
    );
  },

  // Convenience method: Wait for specific node count
  waitForNodeCount: async ({}, playwrightUse) => {
    await playwrightUse(async (page: Page, expectedCount: number) => {
      await page.waitForFunction(
        (count) => {
          const state = window.REDUX_STORE?.getState();
          if (!state?.sessions) return false;

          const sessionKey = state.activeSessionId as string;
          if (!sessionKey) return false;

          const sessions = state.sessions as SessionsState;

          const nodes = sessions[sessionKey]?.network?.nodes;
          return nodes?.length === count;
        },
        expectedCount,
        { timeout: 10000 },
      );
    });
  },

  // Convenience method: Wait for specific edge count
  waitForEdgeCount: async ({}, playwrightUse) => {
    await playwrightUse(async (page: Page, expectedCount: number) => {
      await page.waitForFunction(
        (count) => {
          const state = window.REDUX_STORE?.getState();
          if (!state?.sessions) return false;

          const sessionKey = state.activeSessionId as string;
          if (!sessionKey) return false;

          const sessions = state.sessions as SessionsState;

          const edges = sessions[sessionKey]?.network?.edges;
          return edges?.length === count;
        },
        expectedCount,
        { timeout: 10000 },
      );
    });
  },
});
