import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { configureStore, createReducer } from '@reduxjs/toolkit';
import { action } from 'storybook/actions';
import {
  addEdge,
  addNodeToPrompt,
  deleteEdge,
  removeNodeFromPrompt,
  toggleNodeAttributes,
  updateEgo,
  updateNode,
  updatePrompt,
  updateStage,
} from '~/lib/interviewer/ducks/modules/session';

type MockProtocol = {
  id: string;
  schemaVersion: number;
  codebook: Record<string, unknown>;
  stages: unknown[];
  assets: unknown[];
};

type MockSession = {
  id: string;
  currentStep: number;
  promptIndex: number;
  startTime: string;
  finishTime: null;
  exportTime: null;
  lastUpdated: string;
  network: {
    ego: Record<string, unknown>;
    nodes: Record<string, unknown>[];
    edges: Record<string, unknown>[];
  };
};

const mockUiState = {
  passphrase: null as string | null,
  passphraseInvalid: false,
  showPassphrasePrompter: false,
};

export type MockStore = ReturnType<typeof createMockStore>;

export function createMockStore(protocol: MockProtocol, session: MockSession) {
  const sessionReducer = createReducer(session, (builder) => {
    builder
      .addCase(updateNode.fulfilled, (state, reduxAction) => {
        const { nodeId, newAttributeData } = reduxAction.payload;
        const node = state.network.nodes.find(
          (n) => n[entityPrimaryKeyProperty] === nodeId,
        );
        if (node) {
          Object.assign(
            node[entityAttributesProperty] as Record<string, unknown>,
            newAttributeData,
          );
        }
        action('updateNode')({ nodeId, newAttributeData });
      })
      .addCase(addEdge.fulfilled, (state, reduxAction) => {
        const { from, to, type, attributeData, edgeId } = reduxAction.payload;
        state.network.edges.push({
          [entityPrimaryKeyProperty]: edgeId,
          from,
          to,
          type,
          [entityAttributesProperty]: attributeData,
        });
      })
      .addCase(deleteEdge, (state, reduxAction) => {
        state.network.edges = state.network.edges.filter(
          (edge) => edge[entityPrimaryKeyProperty] !== reduxAction.payload,
        );
      })
      .addCase(toggleNodeAttributes, (state, reduxAction) => {
        const { nodeId, attributes } = reduxAction.payload;
        const node = state.network.nodes.find(
          (n) => n[entityPrimaryKeyProperty] === nodeId,
        );
        if (node) {
          Object.assign(
            node[entityAttributesProperty] as Record<string, unknown>,
            attributes,
          );
        }
      })
      .addCase(updatePrompt, (state, reduxAction) => {
        state.promptIndex = reduxAction.payload;
      })
      .addCase(updateStage, (state, reduxAction) => {
        state.currentStep = reduxAction.payload;
        state.promptIndex = 0;
      })
      .addCase(updateEgo.fulfilled, (state, reduxAction) => {
        Object.assign(
          state.network.ego[entityAttributesProperty] as Record<
            string,
            unknown
          >,
          reduxAction.payload,
        );
      })
      .addCase(addNodeToPrompt.fulfilled, (state, reduxAction) => {
        const { nodeId, promptId, promptAttributes } = reduxAction.payload;
        const node = state.network.nodes.find(
          (n) => n[entityPrimaryKeyProperty] === nodeId,
        );
        if (node) {
          const promptIDs = (node.promptIDs ?? []) as string[];
          if (promptId) {
            promptIDs.push(promptId);
          }
          node.promptIDs = promptIDs;
          Object.assign(
            node[entityAttributesProperty] as Record<string, unknown>,
            promptAttributes,
          );
        }
      })
      .addCase(removeNodeFromPrompt.fulfilled, (state, reduxAction) => {
        const { nodeId, promptId, promptAttributes } = reduxAction.payload;
        const node = state.network.nodes.find(
          (n) => n[entityPrimaryKeyProperty] === nodeId,
        );
        if (node) {
          node.promptIDs = ((node.promptIDs ?? []) as string[]).filter(
            (id: string) => id !== promptId,
          );
          const toggled = Object.fromEntries(
            Object.entries(promptAttributes).map(([k, v]) => [k, !v]),
          );
          Object.assign(
            node[entityAttributesProperty] as Record<string, unknown>,
            toggled,
          );
        }
      });
  });

  return configureStore({
    reducer: {
      session: sessionReducer,
      protocol: (state: typeof protocol = protocol) => state,
      ui: (state: typeof mockUiState = mockUiState) => state,
    },
    preloadedState: {
      protocol,
      session,
      ui: mockUiState,
    },
  });
}
