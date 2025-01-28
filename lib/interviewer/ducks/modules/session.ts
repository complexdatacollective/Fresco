import {
  createAction,
  createAsyncThunk,
  createReducer,
} from '@reduxjs/toolkit';
import { find, get, invariant } from 'es-toolkit/compat';
import { v4 as uuid, v4 } from 'uuid';
import { z } from 'zod';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  entitySecureAttributesMeta,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '~/lib/shared-consts';
import { generateSecureAttributes } from '../../containers/Interfaces/Anonymisation/utils';
import { getCodebookVariablesForNodeType } from '../../selectors/protocol';
import { getCurrentStageId, getPromptId } from '../../selectors/session';
import { type RootState } from '../../store';
import { getDefaultAttributesForEntityType } from '../../utils/getDefaultAttributesForEntityType';

// reducer helpers:
function flipEdge(edge: Partial<NcEdge>) {
  return { from: edge.to, to: edge.from, type: edge.type };
}

/**
 * Check if an edge exists in the network
 * @param {Array} edges - Array of edges
 * @param {string} from - UID of the source node
 * @param {string} to - UID of the target node
 * @param {string} type - Type of edge
 * @returns {string|boolean} - Returns the UID of the edge if it exists, otherwise false
 * @example
 * const edgeExists = edgeExists(edges, 'a', 'b', 'friend');
 *
 */
export function edgeExists(
  edges: NcEdge[],
  from: NcEdge['from'],
  to: NcEdge['to'],
  type: NcEdge['type'],
): NcEdge[EntityPrimaryKey] | false {
  const forwardsEdge = find(edges, { from, to, type });
  const reverseEdge = find(edges, flipEdge({ from, to, type }));

  if (forwardsEdge ?? reverseEdge) {
    const foundEdge = (forwardsEdge ?? reverseEdge)!;
    return get(foundEdge, entityPrimaryKeyProperty);
  }

  return false;
}

const StageMetadataEntrySchema = z.tuple([
  z.number(),
  z.string(),
  z.string(),
  z.boolean(),
]);

export const StageMetadataSchema = z.record(
  z.number(),
  z.array(StageMetadataEntrySchema),
);

export type StageMetadataEntry = [number, string, string, boolean];
export type StageMetadata = Record<number, StageMetadataEntry[]>;

export type SessionState = {
  id: string;
  startTime: string;
  finishTime: string | null;
  exportTime: string | null;
  lastUpdated: string;
  network: NcNetwork;
  currentStep: number;
  promptIndex?: number;
  stageMetadata?: StageMetadata; // Used as temporary storage by DyadCensus/TieStrengthCensus
};

const actionTypes = {
  setSessionFinished: 'SESSION/SET_SESSION_FINISHED',
  updatePrompt: 'SESSION/UPDATE_PROMPT',
  updateStage: 'SESSION/UPDATE_STAGE',
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

export const initialNetwork: NcNetwork = {
  ego: {
    [entityPrimaryKeyProperty]: v4(),
    [entityAttributesProperty]: {},
  },
  nodes: [],
  edges: [],
};

const initialState = {} as SessionState;

export const addNode = createAsyncThunk(
  actionTypes.addNode,
  async (
    props: {
      type: NcNode['type'];
      attributeData: NcNode[EntityAttributesProperty];
    },
    { getState },
  ) => {
    const { type, attributeData } = props;
    const state = getState() as RootState;
    const sessionMeta = getSessionMeta(state);
    const variablesForType = getCodebookVariablesForNodeType(type)(state);

    const mergedAttributes = {
      ...getDefaultAttributesForEntityType(variablesForType),
      ...attributeData,
    };

    const { passphrase } = state.ui;

    invariant(
      passphrase,
      'Passphrase is required to add a node when encryption is enabled',
    );

    const { secureAttributes, encryptedAttributes } =
      await generateSecureAttributes(
        mergedAttributes,
        variablesForType,
        passphrase,
      );

    return {
      sessionMeta,
      type,
      attributeData: encryptedAttributes,
      secureAttributes,
    };
  },
);

export const addEdge = createAsyncThunk(
  actionTypes.addEdge,
  (
    props: {
      modelData: {
        from: NcNode[EntityPrimaryKey];
        to: NcNode[EntityPrimaryKey];
        type: NcNode['type'];
      };
      attributeData?: Record<string, unknown>;
    },
    { getState },
  ) => {
    const {
      modelData: { type },
      attributeData,
    } = props;
    const state = getState();
    const sessionMeta = getSessionMeta(state);

    const variablesForType = getCodebookVariablesForNodeType(type)(state);

    const mergedAttributes = {
      ...getDefaultAttributesForEntityType(variablesForType),
      ...attributeData,
    };

    return {
      sessionMeta,
      modelData: props.modelData,
      attributeData: mergedAttributes,
    };
  },
);

export const deleteNode = createAction<NcNode[EntityPrimaryKey]>(
  actionTypes.deleteNode,
);

export const deleteEdge = createAction<NcEdge[EntityPrimaryKey]>(
  actionTypes.deleteEdge,
);

export const updateNode = createAction<{
  nodeId: EntityPrimaryKey;
  newModelData: Record<string, unknown>;
  newAttributeData: Record<string, unknown>;
}>(actionTypes.updateNode);

export const updatePrompt = createAction<number>(actionTypes.updatePrompt);
export const updateStage = createAction<number>(actionTypes.updateStage);

export const toggleEdge = createAsyncThunk(
  actionTypes.toggleEdge,
  (
    props: {
      modelData: {
        from: NcNode[EntityPrimaryKey];
        to: NcNode[EntityPrimaryKey];
        type: NcNode['type'];
      };
      attributeData?: Record<string, unknown>;
    },
    { getState, dispatch },
  ) => {
    const { modelData, attributeData } = props;
    const state = getState() as RootState;

    const existingEdge = edgeExists(
      state.session.network.edges,
      modelData.from,
      modelData.to,
      modelData.type,
    );

    if (existingEdge) {
      return dispatch(deleteEdge(existingEdge));
    }

    return dispatch(addEdge({ modelData, attributeData }));
  },
);

const sessionReducer = createReducer(initialState, (builder) => {
  builder.addCase(addNode.fulfilled, (state, action) => {
    const { secureAttributes } = action.payload;
    const { promptId, stageId } = action.payload.sessionMeta;
    invariant(promptId, 'Prompt ID is required to add a node');
    invariant(stageId, 'Stage ID is required to add a node');

    const {
      payload: { type, attributeData },
    } = action;

    const newNode = {
      [entityPrimaryKeyProperty]: uuid(),
      type,
      [entityAttributesProperty]: attributeData,
      [entitySecureAttributesMeta]: secureAttributes,
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
        edges: network.edges.filter(
          (edge) => edge.from !== action.payload && edge.to !== action.payload,
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

  builder.addCase(addEdge.fulfilled, (state, action) => {
    const {
      payload: { modelData, attributeData },
    } = action;

    const newEdge = {
      [entityPrimaryKeyProperty]: uuid(),
      from: modelData.from,
      to: modelData.to,
      type: modelData.type,
      [entityAttributesProperty]: attributeData,
    };

    return {
      ...state,
      lastUpdated: new Date().toISOString(),
      network: {
        ...state.network,
        edges: [...state.network.edges, newEdge],
      } as NcNetwork,
    };
  });

  builder.addCase(deleteEdge, (state, action) => {
    const { network } = state;
    const { edges } = network;

    return {
      ...state,
      lastUpdated: new Date().toISOString(),
      network: {
        ...network,
        edges: edges.filter(
          (edge) => edge[entityPrimaryKeyProperty] !== action.payload,
        ),
      },
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

const getSessionMeta = (state) => {
  const promptId = getPromptId(state);
  const stageId = getCurrentStageId(state);

  return {
    promptId,
    stageId,
  };
};

export const addNodeToPrompt = createAsyncThunk(
  actionTypes.addNodeToPrompt,
  (
    props: {
      nodeId: EntityPrimaryKey;
      promptAttributes: Record<string, unknown>;
    },
    { getState },
  ) => {
    const { nodeId, promptAttributes } = props;
    const state = getState();
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
  (
    props: {
      modelData: Record<string, unknown>;
      attributeData: Record<string, unknown>;
    },
    { getState },
  ) => {
    const { modelData, attributeData } = props;
    const state = getState();
    const sessionMeta = getSessionMeta(state);

    return {
      sessionMeta,
      modelData,
      attributeData,
    };
  },
);

export const updateEdge = createAction<{
  edgeId: EntityPrimaryKey;
  newModelData: Record<string, unknown>;
  newAttributeData: Record<string, unknown>;
}>(actionTypes.updateEdge);

export const updateStageMetadata = createAction<StageMetadata>(
  actionTypes.updateStageMetadata,
);
export const setSessionFinished = createAction<string>(
  actionTypes.setSessionFinished,
);

export default sessionReducer;
