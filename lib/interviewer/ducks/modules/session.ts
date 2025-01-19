import { type Dispatch } from '@reduxjs/toolkit';
import { omit } from 'es-toolkit';
import { invariant } from 'es-toolkit/compat';
import {
  entityPrimaryKeyProperty,
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  type NcEdge,
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
      case networkActionTypes.deleteNode: {
        // case networkActionTypes.updateEgo: // case networkActionTypes.removeEdge: // case networkActionTypes.toggleEdge: // case networkActionTypes.updateEdge: // case networkActionTypes.addEdge: // case networkActionTypes.addNodeToPrompt: // case networkActionTypes.removeNodeFromPrompt: // case networkActionTypes.updateNode: // case networkActionTypes.toggleNodeAttributes:
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
        invariant(state[action.sessionId], 'Session does not exist');
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            finishTime: new Date(),
          }),
        };
      }
      case actionTypes.updatePrompt: {
        invariant(state[action.sessionId], 'Session does not exist');
        return {
          ...state,
          [action.sessionId]: withTimestamp({
            ...state[action.sessionId],
            promptIndex: action.promptIndex,
          }),
        };
      }
      case actionTypes.updateStage: {
        invariant(state[action.sessionId], 'Session does not exist');
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
        const session = state[action.sessionId];
        invariant(session, 'Session does not exist');
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
      type: networkActionTypes.addNodeToPrompt,
      sessionId: activeSessionId,
      nodeId,
      promptId,
      promptAttributes,
    });
  };

const toggleNodeAttributes = (uid, attributes) => (dispatch, getState) => {
  const { activeSessionId } = getState();

  dispatch({
    type: networkActionTypes.toggleNodeAttributes,
    sessionId: activeSessionId,
    [entityPrimaryKeyProperty]: uid,
    attributes,
  });
};

const removeNodeFromPrompt =
  (nodeId, promptId, promptAttributes) => (dispatch, getState) => {
    const { activeSessionId } = getState();

    dispatch({
      type: networkActionTypes.removeNodeFromPrompt,
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
      type: networkActionTypes.updateEgo,
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
      type: networkActionTypes.addEdge,
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
      type: networkActionTypes.updateEdge,
      sessionId: activeSessionId,
      edgeId,
      newModelData,
      newAttributeData,
    });
  };

const toggleEdge =
  (modelData, attributeData = {}) =>
  (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId, sessions, installedProtocols } = getState();

    const activeProtocol =
      installedProtocols[sessions[activeSessionId].protocolId];
    const edgeRegistry = activeProtocol.codebook.edge;

    const registryForType = edgeRegistry[modelData.type].variables;

    dispatch({
      type: networkActionTypes.toggleEdge,
      sessionId: activeSessionId,
      modelData,
      attributeData: {
        ...getDefaultAttributesForEntityType(registryForType),
        ...attributeData,
      },
    });
  };

const deleteEdge =
  (edgeId: NcEdge[EntityPrimaryKey]) =>
  (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId } = getState();

    dispatch({
      type: networkActionTypes.deleteEdge,
      sessionId: activeSessionId,
      edgeId,
    });
  };

const updatePrompt =
  (promptIndex: number) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const sessionId = state.activeSessionId;

    dispatch({
      type: actionTypes.updatePrompt,
      sessionId,
      promptIndex,
    });
  };

const updateStage =
  (currentStep: number) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const sessionId = state.activeSessionId;

    dispatch({
      type: actionTypes.updateStage,
      sessionId,
      currentStep,
    });
  };

const withSessionId = (action) => (dispatch: Dispatch, getState: GetState) => {
  const { activeSessionId: sessionId } = getState();

  dispatch({
    ...action,
    sessionId,
  });
};

const updateStageMetadata =
  (state) => (dispatch: Dispatch, getState: GetState) => {
    const { activeSessionId, sessions } = getState();
    const { currentStep } = sessions[activeSessionId];

    dispatch(
      withSessionId({
        type: actionTypes.updateStageMetadata,
        currentStep,
        state,
      }),
    );
  };

const setSessionFinished = (id: string) => ({
  type: actionTypes.setSessionFinished,
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
  removeEdge: deleteEdge,
  toggleNodeAttributes,
  updatePrompt,
  updateStage,
  updateStageMetadata,
  setSessionFinished,
};

export { actionCreators, actionTypes };

export default getReducer(networkReducer);
