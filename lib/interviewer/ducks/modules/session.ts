import { type Dispatch } from '@reduxjs/toolkit';
import { omit } from 'es-toolkit';
import { invariant } from 'es-toolkit/compat';
import { v4 as uuid } from 'uuid';
import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type NcNetwork,
  type NcNode,
} from '~/lib/shared-consts';
import { getPromptId } from '../../selectors/interface';
import { getCodebookVariablesForNodeType } from '../../selectors/protocol';
import { getActiveSessionId, getCurrentStageId } from '../../selectors/session';
import {
  type GetState,
  type RootState,
  type Session,
  type StageMetadata,
} from '../../store';
import { getDefaultAttributesForEntityType } from '../../utils/getDefaultAttributesForEntityType';
import networkReducer, {
  actionTypes as networkActionTypes,
  type AddNodeAction,
  type DeleteNodeAction,
  type NetworkActions,
  type UpdateNodeAction,
} from './network';
import {
  actionTypes as setServerSessionActions,
  type SetServerSessionAction,
} from './setServerSession';

const actionTypes = {
  addSession: 'SESSION/ADD_SESSION',
  setSessionFinished: 'SESSION/SET_SESSION_FINISHED',
  updatePrompt: 'SESSION/UPDATE_PROMPT',
  updateStage: 'SESSION/UPDATE_STATE',
  updateStageMetadata: 'SESSION/UPDATE_STAGE_METADATA',
};

const initialState = {} as Record<string, SessionWithoutId>;

const withTimestamp = (session: SessionWithoutId) => ({
  ...session,
  lastUpdated: new Date().toISOString(),
});

type Action = SetServerSessionAction | NetworkActions;
export type SessionWithoutId = Omit<Session, 'id'>;

const getReducer =
  (network: typeof networkReducer) =>
  (state = initialState, action: Action): Record<string, SessionWithoutId> => {
    switch (action.type) {
      case setServerSessionActions.setServerSession: {
        const session = omit(action.payload, ['protocol']);

        return {
          ...state,
          [action.payload.id]: {
            ...session,
            network: (action.payload.network ??
              network(undefined, {
                type: networkActionTypes.initialize,
              })) as unknown as NcNetwork,
            stageMetadata: (action.payload.stageMetadata ?? {}) as Record<
              string,
              StageMetadata
            >,
          },
        };
      }
      // Whenever a network action occurs, pass the action through to the network reducer
      case networkActionTypes.addNode:
      case networkActionTypes.deleteNode: // case networkActionTypes.removeNodeFromPrompt: // case networkActionTypes.updateNode: // case networkActionTypes.toggleNodeAttributes:
      // case networkActionTypes.addNodeToPrompt:
      // case networkActionTypes.addEdge:
      // case networkActionTypes.updateEdge:
      // case networkActionTypes.toggleEdge:
      // case networkActionTypes.removeEdge:
      // case networkActionTypes.updateEgo:
      {
        const session = state[action.sessionMeta.sessionId];
        invariant(session, 'Session does not exist');

        return {
          ...state,
          [action.sessionMeta.sessionId]: withTimestamp({
            ...session,
            // Reset finished and exported state if network changes
            finishTime: null,
            exportTime: null,
            network: network(session.network, action),
          }),
        };
      }
      case actionCreators.setSessionFinished: {
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
      case actionTypes.updatePrompt: {
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
      case actionTypes.updateStage: {
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
      case actionTypes.updateStageMetadata: {
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

export type ActionWithSessionMeta = {
  sessionMeta: {
    sessionId: string;
    promptId?: string;
    stageId?: string;
  };
};

const getSessionMeta = (state: RootState) => {
  const sessionId = getActiveSessionId(state);
  invariant(sessionId, 'Session ID is required.');

  const promptId = getPromptId(state) ?? undefined;
  const stageId = getCurrentStageId(state) ?? undefined;

  return {
    sessionId,
    promptId,
    stageId,
  };
};

const addNode =
  (
    type: NcNode['type'],
    attributeData: NcNode[EntityAttributesProperty] = {},
  ) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const variablesForType = getCodebookVariablesForNodeType(type)(state);

    const defaultVariablesForType =
      getDefaultAttributesForEntityType(variablesForType);

    dispatch<AddNodeAction>({
      type: networkActionTypes.addNode,
      sessionMeta: getSessionMeta(state),
      payload: {
        type,
        attributeData: {
          ...defaultVariablesForType,
          ...attributeData,
        },
      },
    });
  };

const deleteNode =
  (uid: EntityPrimaryKey) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    dispatch<DeleteNodeAction>({
      type: networkActionTypes.deleteNode,
      sessionMeta: getSessionMeta(state),
      [entityPrimaryKeyProperty]: uid,
    });
  };

const updateNode =
  (nodeId: EntityPrimaryKey, newModelData = {}, newAttributeData = {}) =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();

    dispatch<UpdateNodeAction>({
      type: networkActionTypes.updateNode,

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
  deleteNode,
  addNodeToPrompt,
  updateNode,
  removeNodeFromPrompt,
  updateEgo,
  addEdge,
  updateEdge,
  toggleEdge,
  removeEdge,
  toggleNodeAttributes,
  addSession,
  updatePrompt,
  updateStage,
  updateStageMetadata,
  removeSession,
  setSessionFinished,
  setSessionExported,
};

export { actionCreators, actionTypes };

export default getReducer(networkReducer);
