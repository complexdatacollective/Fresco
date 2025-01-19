import {
  createAction,
  createAsyncThunk,
  createReducer,
} from '@reduxjs/toolkit';
import { omit } from 'es-toolkit';
import { invariant } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '~/lib/shared-consts';
import { getPromptId } from '../../selectors/interface';
import { getCurrentStageId } from '../../selectors/session';
import { getDefaultAttributesForEntityType } from '../../utils/getDefaultAttributesForEntityType';
import { setServerSession } from './setServerSession';

export type StageMetadataEntry = [number, string, string, boolean];
export type StageMetadata = StageMetadataEntry[];

export type SessionState = {
  id: string;
  passphrase: string | null;
  encryptionEnabled: boolean;
  startTime: string;
  finishTime: string | null;
  exportTime: string | null;
  lastUpdated: string;
  network: NcNetwork;
  currentStep: number;
  promptIndex?: number;
  stageMetadata?: Record<number, StageMetadata>; // Used as temporary storage by DyadCensus/TieStrengthCensus
};

const actionTypes = {
  initialize: 'NETWORK/INITIALIZE' as const,
  setSessionFinished: 'SESSION/SET_SESSION_FINISHED',
  updatePrompt: 'SESSION/UPDATE_PROMPT',
  updateStage: 'SESSION/UPDATE_STATE',
  updateStageMetadata: 'SESSION/UPDATE_STAGE_METADATA',
  addNode: 'NETWORK/ADD_NODE' as const,
  deleteNode: 'NETWORK/DELETE_NODE' as const,
  updateNode: 'NETWORK/UPDATE_NODE' as const,
  toggleNodeAttributes: 'NETWORK/TOGGLE_NODE_ATTRIBUTES' as const,
  addNodeToPrompt: 'NETWORK/ADD_NODE_TO_PROMPT' as const,
  removeNodeFromPrompt: 'NETWORK/REMOVE_NODE_FROM_PROMPT' as const,
  addEdge: 'NETWORK/ADD_EDGE' as const,
  updateEdge: 'NETWORK/UPDATE_EDGE' as const,
  toggleEdge: 'NETWORK/TOGGLE_EDGE' as const,
  deleteEdge: 'NETWORK/DELETE_EDGE' as const,
  updateEgo: 'NETWORK/UPDATE_EGO' as const,
};

const initialState = {} as SessionState;

export const addNode = createAsyncThunk(
  actionTypes.addNode,
  (type: NcNode['type'], attributeData: NcNode[EntityAttributesProperty]) => {
    const state = getState();
    const sessionMeta = getSessionMeta(state);

    return {
      sessionMeta,
      type,
      attributeData,
    };
  },
);

export const deleteNode = createAction<NcNode[EntityPrimaryKey]>(
  actionTypes.deleteNode,
);

export const updateNode = createAction<{
  nodeId: EntityPrimaryKey;
  newModelData: Record<string, unknown>;
  newAttributeData: Record<string, unknown>;
}>(actionTypes.updateNode);

export const updatePrompt = createAction<number>('SESSION/UPDATE_PROMPT');
export const updateStage = createAction<number>('SESSION/UPDATE_STAGE');

const sessionReducer = createReducer(initialState, (builder) => {
  builder.addCase(setServerSession, (_state, action) => {
    const session = omit(action.payload, ['protocol']);

    return {
      ...session,
      passphrase: null,
      encryptionEnabled: false,
      network:
        (action.payload.network as NcNetwork) ??
        ({
          ego: {
            [entityPrimaryKeyProperty]: uuid(),
            [entityAttributesProperty]: {},
          },
          nodes: [],
          edges: [],
        } as NcNetwork),
      stageMetadata: (action.payload.stageMetadata ?? {}) as Record<
        string,
        StageMetadata
      >,
    };
  });

  builder.addCase(addNode.fulfilled, (state, action) => {
    const { promptId, stageId } = action.payload.sessionMeta;
    invariant(promptId, 'Prompt ID is required to add a node');
    invariant(stageId, 'Stage ID is required to add a node');

    const {
      payload: { type, attributeData },
    } = action;

    const newNode: NcNode = {
      [entityPrimaryKeyProperty]: uuid(),
      type,
      [entityAttributesProperty]: attributeData,
      promptIDs: [promptId],
      stageId: stageId,
    };

    return {
      ...state,
      lastUpdated: new Date().toISOString(),
      network: {
        ...state.network,
        nodes: [...state.network.nodes, newNode],
      },
    };
  });

  builder.addCase(deleteNode, (state, action) => {
    const { network } = state;
    const { nodes } = network;

    return {
      ...state,
      lastUpdated: new Date().toISOString(),
      network: {
        ...network,
        nodes: nodes.filter(
          (node) => node[entityPrimaryKeyProperty] !== action.payload,
        ),
      },
    };
  });

  builder.addCase(updatePrompt, (state, action) => {
    return {
      ...state,
      promptIndex: action.payload,
    };
  });

  builder.addCase(updateStage, (state, action) => {
    return {
      ...state,
      currentStep: action.payload,
      promptIndex: 0,
    };
  });

  builder.addCase(updateNode, (state, action) => {
    const { nodeId, newModelData, newAttributeData } = action.payload;
    const { network } = state;
    const { nodes } = network;

    return {
      ...state,
      lastUpdated: new Date().toISOString(),
      network: {
        ...network,
        nodes: nodes.map((node) => {
          if (node[entityPrimaryKeyProperty] !== nodeId) {
            return node;
          }

          const mergedPromptIDs = new Set([
            ...(node.promptIDs ?? []),
            newModelData.promptId ?? [],
          ]);

          return {
            ...node,
            ...newModelData,
            promptIDs: Array.from(mergedPromptIDs),
            [entityAttributesProperty]: {
              ...node[entityAttributesProperty],
              ...newAttributeData,
            },
          };
        }),
      } as NcNetwork,
    };
  });
});

// const getReducer =
//   (network: typeof networkReducer) =>
//   (state = initialState, action: Action): Session => {
//     switch (action.type) {
//       // Whenever a network action occurs, pass the action through to the network reducer
//       case networkActionTypes.addNode:
//       case networkActionTypes.deleteNode: {
//         // case networkActionTypes.updateEgo: // case networkActionTypes.removeEdge: // case networkActionTypes.toggleEdge: // case networkActionTypes.updateEdge: // case networkActionTypes.addEdge: // case networkActionTypes.addNodeToPrompt: // case networkActionTypes.removeNodeFromPrompt: // case networkActionTypes.updateNode: // case networkActionTypes.toggleNodeAttributes:
//         const session = state[action.sessionMeta.sessionId];
//         invariant(session, 'Session does not exist');

//         return {
//           ...state,
//           [action.sessionMeta.sessionId]: withTimestamp({
//             ...session,
//             // Reset finished and exported state if network changes
//             finishTime: null,
//             exportTime: null,
//             network: network(session.network, action),
//           }),
//         };
//       }
//       case actionCreators.setSessionFinished: {
//         invariant(state[action.sessionId], 'Session does not exist');
//         return {
//           ...state,
//           [action.sessionId]: withTimestamp({
//             ...state[action.sessionId],
//             finishTime: new Date(),
//           }),
//         };
//       }
//       case actionTypes.updatePrompt: {
//         invariant(state[action.sessionId], 'Session does not exist');
//         return {
//           ...state,
//           [action.sessionId]: withTimestamp({
//             ...state[action.sessionId],
//             promptIndex: action.promptIndex,
//           }),
//         };
//       }
//       case actionTypes.updateStage: {
//         invariant(state[action.sessionId], 'Session does not exist');
//         return {
//           ...state,
//           [action.sessionId]: withTimestamp({
//             ...state[action.sessionId],
//             currentStep: action.currentStep,
//             promptIndex: 0,
//           }),
//         };
//       }
//       case actionTypes.updateStageMetadata: {
//         const session = state[action.sessionId];
//         invariant(session, 'Session does not exist');
//         return {
//           ...state,
//           [action.sessionId]: withTimestamp({
//             ...session,
//             stageMetadata: {
//               ...session.stageMetadata,
//               [action.currentStep]: action.state,
//             },
//           }),
//         };
//       }
//       default:
//         return state;
//     }
//   };

const getSessionMeta = (state: RootState) => {
  const promptId = getPromptId(state);
  const stageId = getCurrentStageId(state);

  return {
    promptId,
    stageId,
  };
};

export const addNodeToPrompt = createAsyncThunk(
  actionTypes.addNodeToPrompt,
  (nodeId: EntityPrimaryKey, promptAttributes: Record<string, unknown>) => {
    const state = store.getState();
    const promptId = getPromptId(state);

    return {
      nodeId,
      promptId,
      promptAttributes,
    };
  },
);

export const toggleNodeAttributes = createAction<{
  uid: EntityPrimaryKey;
  attributes: Record<string, unknown>;
}>(actionTypes.toggleNodeAttributes);

export const removeNodeFromPrompt = createAction<{
  nodeId: EntityPrimaryKey;
  promptId: string;
  promptAttributes: Record<string, unknown>;
}>(actionTypes.removeNodeFromPrompt);

export const updateEgo = createAsyncThunk(
  actionTypes.updateEgo,
  (modelData = {}, attributeData = {}) => {
    const state = store.getState();
    const { protocol } = state;

    const egoRegistry = protocol.codebook.ego ?? {};

    return {
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(egoRegistry.variables),
        ...attributeData,
      },
    };
  },
);

export const addEdge = createAsyncThunk(
  actionTypes.addEdge,
  (modelData, attributeData = {}) => {
    const state = store.getState();
    const { protocol } = state;

    const edgeRegistry = protocol.codebook.edge;

    const registryForType = edgeRegistry[modelData.type].variables;

    return {
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(registryForType),
        ...attributeData,
      },
    };
  },
);

export const updateEdge = createAction<{
  edgeId: EntityPrimaryKey;
  newModelData: Record<string, unknown>;
  newAttributeData: Record<string, unknown>;
}>(actionTypes.updateEdge);

export const toggleEdge = createAsyncThunk(
  actionTypes.toggleEdge,
  (modelData, attributeData = {}) => {
    const { protocol } = store.getState();

    const edgeRegistry = protocol.codebook.edge;

    const registryForType = edgeRegistry[modelData.type].variables;

    return {
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(registryForType),
        ...attributeData,
      },
    };
  },
);

export const deleteEdge = createAction<NcEdge[EntityPrimaryKey]>(
  actionTypes.deleteEdge,
);

export const updateStageMetadata = createAction<StageMetadata>(
  actionTypes.updateStageMetadata,
);
export const setSessionFinished = createAction<string>(
  actionTypes.setSessionFinished,
);

export { actionTypes };

export default sessionReducer;
