import { type Protocol } from '@prisma/client';
import { type Dispatch } from '@reduxjs/toolkit';
import { omit } from 'es-toolkit';
import { has } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type EntityTypeDefinition,
  type NcNode,
} from '~/lib/shared-consts';
import { getPromptId } from '../../selectors/interface';
import {
  getCodebookVariablesForNodeType,
  getProtocolCodebook,
} from '../../selectors/protocol';
import { getActiveSession } from '../../selectors/session';
import { type GetState, type Session } from '../../store';
import networkReducer, {
  actionTypes as networkActionTypes,
  actionCreators as networkActions,
  type AddNodeAction,
  type ModelData,
  type NetworkActions,
} from './network';
import { SET_SERVER_SESSION } from './setServerSession';

const ADD_SESSION = 'ADD_SESSION';
const SET_SESSION_FINISHED = 'SET_SESSION_FINISHED';
const UPDATE_PROMPT = 'UPDATE_PROMPT';
const UPDATE_STAGE = 'UPDATE_STAGE';
const UPDATE_STAGE_METADATA = 'UPDATE_STAGE_METADATA';

const initialState = {} as Record<string, SessionWithoutId>;

const withTimestamp = (session: SessionWithoutId): SessionWithoutId => ({
  ...session,
  lastUpdated: new Date(),
});

const sessionExists = (
  sessionId: Session['id'],
  sessions: SessionWithoutId[],
) => has(sessions, sessionId);

type setServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  payload: {
    protocol: Protocol;
    session: Session;
  };
};

type Action = setServerSessionAction | NetworkActions;
export type SessionWithoutId = Omit<Session, 'id'>;

const getReducer =
  (network: typeof networkReducer) =>
  (state = initialState, action: Action): Record<string, SessionWithoutId> => {
    switch (action.type) {
      case SET_SERVER_SESSION: {
        if (!action.payload.session) {
          return state;
        }

        return {
          ...state,
          [action.payload.session.id]: {
            ...(omit(action.payload.session, ['id']) as SessionWithoutId),
            network:
              action.payload.session.network ??
              network(undefined, { type: networkActionTypes.INITIALIZE }),
            stageMetadata: action.payload.session.stageMetadata,
          },
        };
      }
      // Whenever a network action occurs, pass the action through to the network reducer
      case networkActionTypes.ADD_NODE:
      case networkActionTypes.ADD_NODE_TO_PROMPT:
      case networkActionTypes.BATCH_ADD_NODES:
      case networkActionTypes.REMOVE_NODE:
      case networkActionTypes.REMOVE_NODE_FROM_PROMPT:
      case networkActionTypes.UPDATE_NODE:
      case networkActionTypes.TOGGLE_NODE_ATTRIBUTES:
      case networkActionTypes.ADD_EDGE:
      case networkActionTypes.UPDATE_EDGE:
      case networkActionTypes.TOGGLE_EDGE:
      case networkActionTypes.REMOVE_EDGE:
      case networkActionTypes.UPDATE_EGO: {
        const third = state[action.sessionId]!.network;
        const test = action;
        const newNetwork = network(third, action);

        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            // Reset finished and exported state if network changes
            finishTime: null,
            exportTime: null,
            network: network(state[action.sessionId].network, action),
          }),
        };
      }
      case SET_SESSION_FINISHED: {
        if (!sessionExists(action.sessionId, state)) {
          return state;
        }
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            finishTime: new Date(),
          }),
        };
      }
      case SET_SESSION_EXPORTED: {
        if (!sessionExists(action.sessionId, state)) {
          return state;
        }
        return {
          ...state,
          [action.sessionId]: {
            ...state[action.sessionId],
            exportTime: new Date(),
          },
        };
      }
      case UPDATE_PROMPT: {
        if (!sessionExists(action.sessionId, state)) {
          return state;
        }
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            promptIndex: action.promptIndex,
          }),
        };
      }
      case UPDATE_STAGE: {
        if (!sessionExists(action.sessionId, state)) {
          return state;
        }
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            currentStep: action.currentStep,
            promptIndex: 0,
          }),
        };
      }
      case UPDATE_STAGE_METADATA: {
        if (!sessionExists(action.sessionId, state)) {
          return state;
        }
        const session = state[action.sessionId];
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...session,
            stageMetadata: {
              ...session.stageMetadata,
              [action.currentStep]: action.state,
            },
          }),
        };
      }
      default:
        return state;
    }
  };

/**
 * This function generates default values for all variables in the variable registry for this node
 * type.
 *
 * @param {object} registryForType - An object containing the variable registry entry for this
 *                                   node type.
 */

const getDefaultAttributesForEntityType = (
  registryForType: EntityTypeDefinition['variables'] = {},
) => {
  const defaultAttributesObject = {} as Record<string, any>;

  // ALL variables initialised as `null`
  Object.keys(registryForType).forEach((variableUUID) => {
    defaultAttributesObject[variableUUID] = null;
  });

  return defaultAttributesObject;
};

/**
 * Take a action (probably a network action, and append the active sessionId
 * to it.
 * @param {object} action redux action object
 */
const withActiveSessionId =
  (action: Action) => (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId: sessionId } = getState();

    dispatch({
      ...action,
      sessionId,
    });
  };

/**
 * Add a batch of nodes to the state.
 *
 * @param {Collection} [nodeList] An array of objects representing nodes to add.
 * @param {Object} [attributeData] Attribute data that will be merged with each node
 * @param {String} [type] A node type ID
 *
 * @memberof! NetworkActionCreators
 * TODO: is `type` superfluous as contained by nodes in nodeList?
 */
const batchAddNodes =
  (
    nodeList: NcNode[],
    attributeData: NcNode['attributes'],
    type: NcNode['type'],
  ) =>
  (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId, sessions, installedProtocols } = getState();

    const session = sessions[activeSessionId];
    const activeProtocol = installedProtocols[session.protocolId];
    const nodeRegistry = activeProtocol.codebook.node;
    const registryForType = nodeRegistry[type].variables;
    const defaultAttributes =
      getDefaultAttributesForEntityType(registryForType);

    dispatch(
      withActiveSessionId(
        networkActions.batchAddNodes(
          nodeList,
          attributeData,
          defaultAttributes,
        ),
      ),
    );
  };

const addNode =
  (
    modelData: ModelData,
    attributeData: NcNode[EntityAttributesProperty] = {},
  ) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const { activeSessionId, sessions, installedProtocols } = state;

    const activeSession = getActiveSession(state);

    const codebook = getProtocolCodebook(state);
    const registryForType = getCodebookVariablesForNodeType(modelData.type);

    // We need to create the `entitySecureAttribtuesMeta` object for the node
    // for any attributes that have `encrypted` set to true in the codebook.

    const modelDataWithSecureAttributes = Object.keys(registryForType).reduce(
      (acc, key) => {
        if (registryForType[key].encrypted) {
          return {
            ...acc,
            [key]: {
              value: modelData[key],
              encrypted: true,
            },
          };
        }
        return {
          ...acc,
          [key]: modelData[key],
        };
      },
      {},
    );

    console.log('modelDataWithSecureAttributes', modelDataWithSecureAttributes);

    // Inject the current promptId into the model data.

    dispatch<AddNodeAction>({
      type: networkActionTypes.ADD_NODE,
      sessionId: activeSessionId!,
      payload: {
        modelData,
        attributeData: {
          ...getDefaultAttributesForEntityType(registryForType),
          ...attributeData,
        },
      },
    });
  };

const updateNode =
  (nodeId: EntityPrimaryKey, newModelData = {}, newAttributeData = {}, sound) =>
  (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId } = getState();

    dispatch({
      type: networkActionTypes.UPDATE_NODE,
      sessionId: activeSessionId,
      nodeId,
      newModelData,
      newAttributeData,
      sound,
    });
  };

const addNodeToPrompt =
  (nodeId: EntityPrimaryKey, promptAttributes: Record<string, unknown>) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const { activeSessionId } = state;
    const promptId = getPromptId(state);

    // fetch

    dispatch({
      type: networkActionTypes.ADD_NODE_TO_PROMPT,
      sessionId: activeSessionId,
      nodeId,
      promptId,
      promptAttributes,
    });
  };

const toggleNodeAttributes = (uid, attributes) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.TOGGLE_NODE_ATTRIBUTES,
    sessionId: activeSessionId,
    [entityPrimaryKeyProperty]: uid,
    attributes,
  });
};

const removeNode = (uid) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.REMOVE_NODE,
    sessionId: activeSessionId,
    [entityPrimaryKeyProperty]: uid,
  });
};

const removeNodeFromPrompt =
  (nodeId, promptId, promptAttributes) => (dispatch, getState) => {
    const { activeSessionId } = getState();

    dispatch({
      type: networkActionTypes.REMOVE_NODE_FROM_PROMPT,
      sessionId: activeSessionId,
      nodeId,
      promptId,
      promptAttributes,
    });
  };

const updateEgo =
  (modelData = {}, attributeData = {}) =>
  (dispatch, getState) => {
    const { activeSessionId, sessions, installedProtocols } = getState();

    const activeProtocol =
      installedProtocols[sessions[activeSessionId].protocolId];
    const egoRegistry = activeProtocol.codebook.ego || {};

    dispatch({
      type: networkActionTypes.UPDATE_EGO,
      sessionId: activeSessionId,
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(egoRegistry.variables),
        ...attributeData,
      },
    });
  };

const addEdge =
  (modelData, attributeData = {}) =>
  (dispatch, getState) => {
    const { activeSessionId, sessions, installedProtocols } = getState();

    const activeProtocol =
      installedProtocols[sessions[activeSessionId].protocolId];
    const edgeRegistry = activeProtocol.codebook.edge;

    const registryForType = edgeRegistry[modelData.type].variables;

    dispatch({
      type: networkActionTypes.ADD_EDGE,
      sessionId: activeSessionId,
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(registryForType),
        ...attributeData,
      },
    });
  };

const updateEdge =
  (edgeId, newModelData = {}, newAttributeData = {}) =>
  (dispatch, getState) => {
    const { activeSessionId } = getState();

    dispatch({
      type: networkActionTypes.UPDATE_EDGE,
      sessionId: activeSessionId,
      edgeId,
      newModelData,
      newAttributeData,
    });
  };

const toggleEdge =
  (modelData, attributeData = {}) =>
  (dispatch, getState) => {
    const { activeSessionId, sessions, installedProtocols } = getState();

    const activeProtocol =
      installedProtocols[sessions[activeSessionId].protocolId];
    const edgeRegistry = activeProtocol.codebook.edge;

    const registryForType = edgeRegistry[modelData.type].variables;

    dispatch({
      type: networkActionTypes.TOGGLE_EDGE,
      sessionId: activeSessionId,
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(registryForType),
        ...attributeData,
      },
    });
  };

const removeEdge = (edgeId) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.REMOVE_EDGE,
    sessionId: activeSessionId,
    edgeId,
  });
};

const addSession =
  (caseId, protocolId, sessionNetwork) => (dispatch, getState) => {
    const id = uuid();

    const { installedProtocols } = getState();
    const activeProtocol = installedProtocols[protocolId];
    const egoRegistry = activeProtocol.codebook.ego || {};
    const egoAttributeData = getDefaultAttributesForEntityType(
      egoRegistry.variables,
    );

    dispatch({
      type: ADD_SESSION,
      sessionId: id,
      ...(sessionNetwork && { network: sessionNetwork }),
      caseId,
      protocolId,
      egoAttributeData, // initial values for ego
    });
  };

const updatePrompt = (promptIndex) => (dispatch, getState) => {
  const state = getState();
  const sessionId = state.activeSessionId;

  dispatch({
    type: UPDATE_PROMPT,
    sessionId,
    promptIndex,
  });
};

const updateStage = (currentStep) => (dispatch, getState) => {
  const state = getState();
  const sessionId = state.activeSessionId;

  dispatch({
    type: UPDATE_STAGE,
    sessionId,
    currentStep,
  });
};

const withSessionId = (action) => (dispatch, getState) => {
  const { activeSessionId: sessionId } = getState();

  dispatch({
    ...action,
    sessionId,
  });
};

const updateStageMetadata = (state) => (dispatch, getState) => {
  const { activeSessionId, sessions } = getState();
  const { currentStep } = sessions[activeSessionId];

  dispatch(
    withSessionId({
      type: UPDATE_STAGE_METADATA,
      currentStep,
      state,
    }),
  );
};

function removeSession(id) {
  return {
    type: REMOVE_SESSION,
    sessionId: id,
  };
}

const setSessionFinished = (id) => ({
  type: SET_SESSION_FINISHED,
  sessionId: id,
});

const setSessionExported = (id) => ({
  type: SET_SESSION_EXPORTED,
  sessionId: id,
});

const actionCreators = {
  addNode,
  addNodeToPrompt,
  batchAddNodes,
  updateNode,
  removeNode,
  removeNodeFromPrompt,
  updateEgo,
  addEdge,
  updateEdge,
  toggleEdge,
  removeEdge,
  toggleNodeAttributes,
  addSession,
  loadSession,
  updatePrompt,
  updateStage,
  updateCaseId,
  updateStageMetadata,
  removeSession,
  setSessionFinished,
  setSessionExported,
};

const actionTypes = {
  ADD_SESSION,
  SET_SESSION_FINISHED,
  SET_SESSION_EXPORTED,
  LOAD_SESSION,
  UPDATE_PROMPT,
  UPDATE_STAGE,
  UPDATE_CASE_ID,
  UPDATE_STAGE_METADATA,
  REMOVE_SESSION,
};

export { actionCreators, actionTypes };

export default getReducer(networkReducer);
