import { omit } from 'es-toolkit';
import { find, get, invariant, isMatch } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  entitySecureAttributesMeta,
  type EntitySecureAttributesMeta,
  type NcEdge,
  type NcNetwork,
  type NcNode,
} from '~/lib/shared-consts';
import {
  type ActionWithSessionMeta,
  actionTypes as sessionActions,
} from './session';

const actionTypes = {
  initialize: 'NETWORK/INITIALIZE' as const,
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
  addSession: 'SESSION/ADD_SESSION' as const,
};

// Initial network model structure
export const initialState: NcNetwork = {
  ego: {
    [entityPrimaryKeyProperty]: uuid(),
    [entityAttributesProperty]: {},
  },
  nodes: [],
  edges: [],
};

// action creators

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
 * if (edgeExists) {
 *  console.log('Edge exists:', edgeExists);
 * }
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

// const formatEgoAttributes = (modelData, attributeData) => ({
//   ...modelData,
//   [entityAttributesProperty]: {
//     ...attributeData,
//   },
// });

// /**
//  * Correctly construct the edge object based on a
//  * edge-like object, and an key-value attributes object
//  */
// const formatEdgeAttributes = (modelData, attributeData) => ({
//   ...modelData,
//   [entityPrimaryKeyProperty]: modelData[entityPrimaryKeyProperty] || uuid(),
//   [entityAttributesProperty]: {
//     ...modelData[entityAttributesProperty],
//     ...attributeData,
//   },
//   type: modelData.type,
// });

const addEdge = (state, action) => ({
  ...state,
  edges: (() =>
    state.edges.concat(
      formatEdgeAttributes(action.modelData, action.attributeData),
    ))(),
});

const removeEdge = (state, edgeId) => ({
  ...state,
  edges: state.edges.filter(
    (edge) => edge[entityPrimaryKeyProperty] !== edgeId,
  ),
});

export type AddNodeAction = ActionWithSessionMeta & {
  type: typeof actionTypes.addNode;
  payload: {
    type: NcNode['type'];
    attributeData: NcNode[EntityAttributesProperty];
    secureAttributes?: NcNode[EntitySecureAttributesMeta];
  };
};

export type DeleteNodeAction = ActionWithSessionMeta & {
  type: typeof actionTypes.deleteNode;
  [entityPrimaryKeyProperty]: NcNode[EntityPrimaryKey];
};

export type UpdateNodeAction = ActionWithSessionMeta & {
  type: typeof actionTypes.updateNode;
  nodeId: NcNode[EntityPrimaryKey];
  newModelData: ModelData;
  newAttributeData: NcNode[EntityAttributesProperty];
};

type ToggleNodeAttributesAction = {
  type: typeof actionTypes.toggleNodeAttributes;
  [entityPrimaryKeyProperty]: NcNode[EntityPrimaryKey];
  attributes: NcNode[EntityAttributesProperty];
};

type AddNodeToPromptAction = {
  type: typeof actionTypes.addNodeToPrompt;
  nodeId: NcNode[EntityPrimaryKey];
  promptId: string;
  promptAttributes: NcNode[EntityAttributesProperty];
};

type RemoveNodeFromPromptAction = {
  type: typeof actionTypes.removeNodeFromPrompt;
  nodeId: NcNode[EntityPrimaryKey];
  promptId: string;
  promptAttributes: NcNode[EntityAttributesProperty];
};

type AddEdgeAction = {
  type: typeof actionTypes.addEdge;
  modelData: NcEdge;
  attributeData: NcEdge['attributes'];
};

type UpdateEdgeAction = {
  type: typeof actionTypes.updateEdge;
  edgeId: NcEdge[EntityPrimaryKey];
  newModelData: NcEdge;
  newAttributeData: NcEdge['attributes'];
};

type ToggleEdgeAction = {
  type: typeof actionTypes.toggleEdge;
  modelData: NcEdge;
};

type RemoveEdgeAction = {
  type: typeof actionTypes.removeEdge;
  edgeId: NcEdge[EntityPrimaryKey];
};

type UpdateEgoAction = {
  type: typeof actionTypes.updateEgo;
  modelData: NcNode;
  attributeData: NcNode[EntityAttributesProperty];
};

type InitializeAction = {
  type: typeof actionTypes.initialize;
};

export type NetworkActions =
  | InitializeAction
  | AddNodeAction
  | DeleteNodeAction;
// | UpdateNodeAction
// | ToggleNodeAttributesAction
// | AddNodeToPromptAction
// | RemoveNodeFromPromptAction
// | AddEdgeAction
// | UpdateEdgeAction
// | ToggleEdgeAction
// | RemoveEdgeAction
// | UpdateEgoAction;

export default function reducer(
  state = initialState,
  action: NetworkActions,
): NcNetwork {
  switch (action.type) {
    case actionTypes.initialize: {
      return initialState;
    }
    case actionTypes.addNode: {
      // Here is where we need to use codebook data to determine if the attribute is encrypted
      // and then store the encrypted data in the secure attributes meta

      // This approach will mean that existing interfaces don't need to update their use
      // of addNode.

      const {
        sessionMeta: { promptId, stageId },
        payload: { type, attributeData },
      } = action;

      invariant(stageId, 'Stage ID is required to add a node');
      invariant(promptId, 'Prompt ID is required to add a node');

      const newNode: NcNode = {
        [entityPrimaryKeyProperty]: uuid(),
        type,
        [entityAttributesProperty]: attributeData,
        promptIDs: [promptId],
        stageId: stageId,
      };

      if (action.payload.secureAttributes) {
        newNode[entitySecureAttributesMeta] = action.payload.secureAttributes;
      }

      return {
        ...state,
        nodes: [...state.nodes, newNode],
      };
    }
    case actionTypes.deleteNode: {
      const removeentityPrimaryKeyProperty = action[entityPrimaryKeyProperty];

      console.log('remove', action, removeentityPrimaryKeyProperty);
      return {
        ...state,
        nodes: state.nodes.filter(
          (node) =>
            node[entityPrimaryKeyProperty] !== removeentityPrimaryKeyProperty,
        ),
        edges: state.edges.filter(
          (edge) =>
            edge.from !== removeentityPrimaryKeyProperty &&
            edge.to !== removeentityPrimaryKeyProperty,
        ),
      };
    }
    case actionTypes.updateEgo: {
      return {
        ...state,
        ego: {
          ...state.ego,
          ...action.modelData,
          [entityAttributesProperty]: {
            ...state.ego[entityAttributesProperty],
            ...action.attributeData,
          },
        },
      };
    }
    case actionTypes.toggleNodeAttributes: {
      return {
        ...state,
        nodes: (() =>
          state.nodes.map(
            (node) => {
              if (
                node[entityPrimaryKeyProperty] !==
                action[entityPrimaryKeyProperty]
              ) {
                return node;
              }

              // If the node's attrs contain the same key/vals, remove them
              if (isMatch(node[entityAttributesProperty], action.attributes)) {
                const omittedKeys = Object.keys(action.attributes);
                const nestedProps = omittedKeys.map(
                  (key) => `${entityAttributesProperty}.${key}`,
                );
                return omit(node, nestedProps);
              }

              // Otherwise, add/update
              return {
                ...node,
                [entityAttributesProperty]: {
                  ...node[entityAttributesProperty],
                  ...action.attributes,
                },
              };
            }, // end node map function
          ))(),
      };
    }
    case actionTypes.updateNode: {
      return {
        ...state,
        nodes: (() =>
          state.nodes.map((node) => {
            if (node[entityPrimaryKeyProperty] !== action.nodeId) {
              return node;
            }
            return {
              ...node,
              ...omit(action.newModelData, 'promptId'),
              promptIDs: action.newModelData.promptId
                ? [...node.promptIDs, action.newModelData.promptId]
                : node.promptIDs,
              [entityAttributesProperty]: {
                ...node[entityAttributesProperty],
                ...action.newAttributeData,
              },
            };
          }))(),
      };
    }

    case actionTypes.addNodeToPrompt: {
      return {
        ...state,
        nodes: (() =>
          state.nodes.map((node) => {
            if (node[entityPrimaryKeyProperty] !== action.nodeId) {
              return node;
            }
            return {
              ...node,
              [entityAttributesProperty]: {
                ...node[entityAttributesProperty],
                ...action.promptAttributes,
              },
              promptIDs: [...node.promptIDs, action.promptId],
            };
          }))(),
      };
    }
    case actionTypes.removeNodeFromPrompt: {
      const togglePromptAttributes = Object.keys(
        action.promptAttributes,
      ).reduce(
        (attributes, attrKey) => ({
          ...attributes,
          [attrKey]: !action.promptAttributes[attrKey],
        }),
        {},
      );
      return {
        ...state,
        nodes: (() =>
          state.nodes.map((node) => {
            if (node[entityPrimaryKeyProperty] !== action.nodeId) {
              return node;
            }
            return {
              ...node,
              [entityAttributesProperty]: {
                ...node[entityAttributesProperty],
                ...togglePromptAttributes,
              },
              promptIDs: node.promptIDs.filter((id) => id !== action.promptId),
            };
          }))(),
      };
    }
    case actionTypes.addEdge: {
      return addEdge(state, action);
    }
    case actionTypes.updateEdge: {
      return {
        ...state,
        edges: (() =>
          state.edges.map((edge) => {
            if (edge[entityPrimaryKeyProperty] !== action.edgeId) {
              return edge;
            }
            return {
              ...edge,
              ...action.newModelData,
              [entityAttributesProperty]: {
                ...edge[entityAttributesProperty],
                ...action.newAttributeData,
              },
            };
          }))(),
      };
    }
    case actionTypes.toggleEdge: {
      // remove edge if it exists, add it if it doesn't
      const { to, from, type } = action.modelData;
      if (!to || !from || !type) {
        return state;
      }

      // Returns an edge UID if an existing edge is found, otherwise false;
      const existingEdgeId = edgeExists(state.edges, from, to, type);

      if (existingEdgeId) {
        // Edge exists - remove it
        return removeEdge(state, existingEdgeId);
      }

      // Edge does not exist - create it
      return addEdge(state, action);
    }
    case actionTypes.removeEdge:
      return removeEdge(state, action.edgeId);
    case sessionActions.addSession: {
      return {
        ...initialState,
        ego: formatEgoAttributes(initialState.ego, action.egoAttributeData),
      };
    }
    default:
      return state;
  }
}

export { actionTypes };
