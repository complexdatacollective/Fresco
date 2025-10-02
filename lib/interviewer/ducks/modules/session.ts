import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  entitySecureAttributesMeta,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type NcEdge,
  type NcEgo,
  type NcEntity,
  type NcNetwork,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import {
  createAction,
  createAsyncThunk,
  createReducer,
  createSelector,
} from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { find, get } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import { z } from 'zod/v3';
import { generateSecureAttributes } from '../../containers/Interfaces/Anonymisation/utils';
import { getAdditionalAttributesSelector } from '../../selectors/prop';
import { makeGetCodebookVariablesForNodeType } from '../../selectors/protocol';
import {
  getCurrentStageId,
  getPromptId,
  makeGetNodeById,
} from '../../selectors/session';
import { type RootState } from '../../store';
import { getDefaultAttributesForEntityType } from '../../utils/getDefaultAttributesForEntityType';
import { getShouldEncryptNames } from './protocol';

// reducer helpers:
function flipEdge(edge: Partial<NcEdge>) {
  return { from: edge.to, to: edge.from, type: edge.type };
}

function withLastUpdated<T>(state: T) {
  return {
    ...state,
    lastUpdated: new Date().toISOString(),
  };
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
    return get(foundEdge, entityPrimaryKeyProperty) ?? false;
  }

  return false;
}

const FamilyTreeCensusStageMetadataSchema = z.object({
  hasSeenScaffoldPrompt: z.boolean(),
});

const DyadCensusMetadataItem = z.tuple([
  z.number(), // prompt index
  z.string(), // entity a
  z.string(), // entity b
  z.boolean(), // is present
]);

export type DyadCensusMetadataItem = z.infer<typeof DyadCensusMetadataItem>;

const DyadCensusStageMetadataSchema = z.array(DyadCensusMetadataItem);

export const StageMetadataSchema = z.record(
  z.string(), // stage ID
  z.union([FamilyTreeCensusStageMetadataSchema, DyadCensusStageMetadataSchema]),
);

type StageMetadata = z.infer<typeof StageMetadataSchema>;
export type StageMetadataEntry = StageMetadata[string];

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
  stageRequiresEncryption?: boolean; // Set to true by the stage if it detects that nodes it creates require encryption
};

const actionTypes = {
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

export const createInitialNetwork = (): NcNetwork => ({
  ego: {
    [entityPrimaryKeyProperty]: uuid(),
    [entityAttributesProperty]: {},
  },
  nodes: [],
  edges: [],
});

const initialState = {} as SessionState;

type AddNodeArgs = {
  type: NcNode['type'];
  attributeData?: NcNode[EntityAttributesProperty];
  modelData?: {
    [entityPrimaryKeyProperty]: NcNode[EntityPrimaryKey];
  };
  useEncryption?: boolean;
};

export const addNode = createAsyncThunk(
  actionTypes.addNode,
  async (args: AddNodeArgs, thunkApi) => {
    const { type, attributeData, modelData, useEncryption } = args;
    const state = thunkApi.getState() as RootState;

    const getCodebookVariablesForNodeType =
      makeGetCodebookVariablesForNodeType(state);

    const variablesForType = getCodebookVariablesForNodeType(type);

    const mergedAttributes = {
      ...getDefaultAttributesForEntityType(variablesForType),
      ...attributeData,
    };

    const sessionMeta = getSessionMeta(state);

    if (!useEncryption) {
      return {
        type,
        attributeData: mergedAttributes,
        modelData,
        sessionMeta,
      };
    }

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
      type,
      attributeData: encryptedAttributes,
      modelData,
      secureAttributes,
      sessionMeta,
    };
  },
);

export const addEdge = createAsyncThunk(
  actionTypes.addEdge,
  (
    props: {
      from: NcNode[EntityPrimaryKey];
      to: NcNode[EntityPrimaryKey];
      type: NcNode['type'];
      attributeData?: Record<string, unknown>;
    },
    { getState },
  ) => {
    const { from, to, type, attributeData } = props;
    const state = getState() as RootState;
    const sessionMeta = getSessionMeta(state);

    const getCodebookVariablesForNodeType =
      makeGetCodebookVariablesForNodeType(state);

    const variablesForType = getCodebookVariablesForNodeType(type);

    const mergedAttributes = {
      ...getDefaultAttributesForEntityType(variablesForType),
      ...attributeData,
    };

    return {
      sessionMeta,
      from,
      to,
      type,
      attributeData: mergedAttributes,
    };
  },
);

export const updateNode = createAsyncThunk(
  actionTypes.updateNode,
  async (
    args: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    },
    thunkApi,
  ) => {
    const { newAttributeData, newModelData, nodeId } = args;
    const state = thunkApi.getState() as RootState;
    const getNodeById = makeGetNodeById(state);
    const node = getNodeById(nodeId);

    invariant(node, 'Node not found');

    const getCodebookVariablesForNodeType =
      makeGetCodebookVariablesForNodeType(state);

    const variablesForType = getCodebookVariablesForNodeType(node.type);

    const useEncryption = getShouldEncryptNames(state);
    // We know that encryption is enabled at the protocol level, but are the node attributes we are updating encrypted?
    const hasEncryptedAttributes = Object.keys(newAttributeData).some(
      (key) => variablesForType[key]?.encrypted,
    );

    if (!useEncryption || !hasEncryptedAttributes) {
      return {
        nodeId,
        newAttributeData,
        newModelData,
        newSecureAttributes: undefined,
      };
    }

    const { passphrase } = state.ui;

    invariant(passphrase, 'Passphrase is required to update this node');

    const { secureAttributes, encryptedAttributes } =
      await generateSecureAttributes(
        newAttributeData,
        variablesForType,
        passphrase,
      );

    return {
      nodeId,
      newAttributeData: encryptedAttributes,
      newModelData: newModelData,
      newSecureAttributes: secureAttributes,
    };
  },
);

export const deleteNode = createAction<NcNode[EntityPrimaryKey]>(
  actionTypes.deleteNode,
);

export const deleteEdge = createAction<NcEdge[EntityPrimaryKey]>(
  actionTypes.deleteEdge,
);

export const updatePrompt = createAction<number>(actionTypes.updatePrompt);
export const updateStage = createAction<number>(actionTypes.updateStage);

export const updateEgo = createAction<NcEgo[EntityAttributesProperty]>(
  actionTypes.updateEgo,
);

export const toggleEdge = createAsyncThunk(
  actionTypes.toggleEdge,
  async (
    props: {
      from: NcNode[EntityPrimaryKey];
      to: NcNode[EntityPrimaryKey];
      type: NcNode['type'];
      attributeData?: Record<string, unknown>;
    },
    { getState, dispatch },
  ) => {
    const { from, to, type, attributeData } = props;
    const state = getState() as RootState;

    const existingEdge = edgeExists(
      state.session.network.edges,
      from,
      to,
      type,
    );

    if (existingEdge) {
      return dispatch(deleteEdge(existingEdge));
    }

    return dispatch(addEdge({ from, to, type, attributeData }));
  },
);

const getSessionMeta = createSelector(
  getPromptId,
  getCurrentStageId,
  (promptId, stageId) => ({ promptId, stageId }),
);

export const addNodeToPrompt = createAsyncThunk(
  actionTypes.addNodeToPrompt,
  (
    props: {
      nodeId: NcNode[EntityPrimaryKey];
      promptAttributes: Record<string, boolean>;
    },
    { getState },
  ) => {
    const { nodeId, promptAttributes } = props;
    const state = getState() as RootState;
    const promptId = getPromptId(state);

    return {
      nodeId,
      promptId,
      promptAttributes,
    };
  },
);

export const toggleNodeAttributes = createAction<{
  nodeId: NcNode[EntityPrimaryKey];
  attributes: Record<string, VariableValue>;
}>(actionTypes.toggleNodeAttributes);

export const removeNodeFromPrompt = createAsyncThunk(
  actionTypes.removeNodeFromPrompt,
  (nodeId: NcNode[EntityPrimaryKey], { getState }) => {
    const state = getState() as RootState;
    const promptId = getPromptId(state);
    invariant(promptId, 'Prompt ID is required to remove a node from a prompt');
    const promptAttributes = getAdditionalAttributesSelector(state);

    return {
      nodeId,
      promptId,
      promptAttributes,
    };
  },
);

export const updateEdge = createAction<{
  edgeId: NcEntity[EntityPrimaryKey]; // Must be uid as this is shared between nodes and edges on slidesform
  newModelData?: Record<string, unknown>;
  newAttributeData?: NcEdge[EntityAttributesProperty];
}>(actionTypes.updateEdge);

export const updateStageMetadata = createAction<StageMetadataEntry>(
  actionTypes.updateStageMetadata,
);

const sessionReducer = createReducer(initialState, (builder) => {
  builder.addCase(addNode.fulfilled, (state, action) => {
    const { secureAttributes, sessionMeta, modelData } = action.payload;
    const { promptId, stageId } = sessionMeta;
    invariant(promptId, 'Prompt ID is required to add a node');
    invariant(stageId, 'Stage ID is required to add a node');

    const {
      payload: { type, attributeData },
    } = action;

    const newNode: NcNode = {
      [entityPrimaryKeyProperty]:
        modelData?.[entityPrimaryKeyProperty] ?? uuid(),
      type,
      [entityAttributesProperty]: attributeData,
      [entitySecureAttributesMeta]: secureAttributes,
      promptIDs: [promptId],
      stageId: stageId,
    };

    return withLastUpdated({
      ...state,
      network: {
        ...state.network,
        nodes: [...state.network.nodes, newNode],
      },
    });
  });

  builder.addCase(addNodeToPrompt.fulfilled, (state, action) => {
    const { nodeId, promptId, promptAttributes } = action.payload;
    const { network } = state;
    const { nodes } = network;

    invariant(promptId, 'Prompt ID is required to add a node to a prompt');

    // TODO: this should possibly encrypt prompt attributes. However, they are
    // boolean values and so are unlikely to be sensitive.

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        nodes: nodes.map((node) => {
          if (node[entityPrimaryKeyProperty] !== nodeId) {
            return node;
          }

          return {
            ...node,
            promptIDs: [...(node.promptIDs ?? []), promptId],
            [entityAttributesProperty]: {
              ...node[entityAttributesProperty],
              ...promptAttributes,
            },
          };
        }),
      },
    });
  });

  builder.addCase(removeNodeFromPrompt.fulfilled, (state, action) => {
    const { nodeId, promptId, promptAttributes } = action.payload;
    const { network } = state;
    const { nodes } = network;

    const toggledPromptAttributes = Object.keys(promptAttributes).reduce(
      (attributes, attrKey) => ({
        ...attributes,
        [attrKey]: !promptAttributes[attrKey],
      }),
      {} as Record<string, boolean>,
    );

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        nodes: nodes.map((node) => {
          if (node[entityPrimaryKeyProperty] !== nodeId) {
            return node;
          }

          return {
            ...node,
            promptIDs: node.promptIDs?.filter((id) => id !== promptId),
            [entityAttributesProperty]: {
              ...node[entityAttributesProperty],
              ...toggledPromptAttributes,
            },
          };
        }),
      },
    });
  });

  builder.addCase(deleteNode, (state, action) => {
    const { network } = state;
    const { nodes } = network;

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        nodes: nodes.filter(
          (node) => node[entityPrimaryKeyProperty] !== action.payload,
        ),
        edges: network.edges.filter(
          (edge) => edge.from !== action.payload && edge.to !== action.payload,
        ),
      },
    });
  });

  builder.addCase(toggleNodeAttributes, (state, action) => {
    const { nodeId, attributes } = action.payload;
    const { network } = state;

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        nodes: network.nodes.map((node) => {
          if (node[entityPrimaryKeyProperty] !== nodeId) {
            return node;
          }

          return {
            ...node,
            [entityAttributesProperty]: {
              ...node[entityAttributesProperty],
              ...attributes,
            },
          };
        }),
      },
    });
  });

  builder.addCase(updatePrompt, (state, action) => {
    return {
      ...state,
      promptIndex: action.payload,
    };
  });

  builder.addCase(updateStage, (state, action) => {
    return withLastUpdated({
      ...state,
      currentStep: action.payload,
      promptIndex: 0,
      stageRequiresEncryption: false,
    });
  });

  builder.addCase(updateNode.fulfilled, (state, action) => {
    const { nodeId, newAttributeData, newModelData, newSecureAttributes } =
      action.payload;
    const { network } = state;
    const { nodes } = network;

    // TODO: must be updated to support encrypted attributes.
    // Should have an additional parameter controlling this (see addNode)
    // Stage should control this parameter, using the usePassphrase hook

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        nodes: nodes.map((node) => {
          if (node[entityPrimaryKeyProperty] !== nodeId) {
            return node;
          }

          const mergedPromptIDs = new Set<string>([]);

          if (node.promptIDs) {
            node.promptIDs.forEach((id) => mergedPromptIDs.add(id));
          }

          if (newModelData && 'promptId' in newModelData) {
            const newId = newModelData.promptId as string;
            mergedPromptIDs.add(newId);
          }

          return {
            ...node,
            ...newModelData,
            promptIDs: Array.from(mergedPromptIDs),
            [entityAttributesProperty]: {
              ...node[entityAttributesProperty],
              ...newAttributeData,
            },
            [entitySecureAttributesMeta]: {
              ...node[entitySecureAttributesMeta],
              ...newSecureAttributes,
            },
          };
        }),
      },
    });
  });

  builder.addCase(addEdge.fulfilled, (state, action) => {
    const {
      payload: { from, to, type, attributeData },
    } = action;

    const newEdge = {
      [entityPrimaryKeyProperty]: uuid(),
      from,
      to,
      type,
      [entityAttributesProperty]: attributeData,
    };

    return withLastUpdated({
      ...state,
      network: {
        ...state.network,
        edges: [...state.network.edges, newEdge],
      } as NcNetwork,
    });
  });

  builder.addCase(deleteEdge, (state, action) => {
    const { network } = state;
    const { edges } = network;

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        edges: edges.filter(
          (edge) => edge[entityPrimaryKeyProperty] !== action.payload,
        ),
      },
    });
  });

  builder.addCase(updateEdge, (state, action) => {
    const { edgeId, newModelData, newAttributeData } = action.payload;
    const { network } = state;
    const { edges } = network;

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        edges: edges.map((edge) => {
          if (edge[entityPrimaryKeyProperty] !== edgeId) {
            return edge;
          }

          return {
            ...edge,
            ...newModelData,
            [entityAttributesProperty]: {
              ...edge[entityAttributesProperty],
              ...newAttributeData,
            },
          };
        }),
      },
    });
  });

  builder.addCase(updateStageMetadata, (state, action) => {
    const stageMetadata = action.payload;
    const currentStep = state.currentStep;
    return withLastUpdated({
      ...state,
      stageMetadata: {
        ...state.stageMetadata,
        [currentStep]: stageMetadata,
      },
    });
  });

  builder.addCase(updateEgo, (state, action) => {
    const { network } = state;

    return withLastUpdated({
      ...state,
      network: {
        ...network,
        ego: {
          ...network.ego,
          [entityAttributesProperty]: {
            ...network.ego[entityAttributesProperty],
            ...action.payload,
          },
        },
      },
    });
  });
});

export default sessionReducer;
