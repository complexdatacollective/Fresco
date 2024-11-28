import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { actionCreators as deviceActions } from './deviceSettings';
import { actionCreators as sessionActions } from './session';

const RESET_STATE = 'RESET_STATE';

const resetPropertyForAllNodes = (property) => (dispatch, getState) => {
  const { activeSessionId } = getState();
  const {
    sessions: {
      [activeSessionId]: {
        network: { nodes },
        protocolUID,
      },
    },
    installedProtocols: {
      [protocolUID]: {
        codebook: { node: nodeRegistry },
      },
    },
  } = getState();

  nodes.forEach((node) => {
    // Node definition may not have any variables
    const registryForType = get(nodeRegistry, [node.type, 'variables'], {});

    if (registryForType[property]) {
      const variableType = registryForType[property].type;
      dispatch(
        sessionActions.updateNode(
          node[entityPrimaryKeyProperty],
          {},
          {
            [property]: variableType === 'boolean' ? false : null,
          },
        ),
      );
    }
  });
};

const resetEdgesOfType = (edgeType) => (dispatch, getState) => {
  const { activeSessionId } = getState();
  const {
    sessions: {
      [activeSessionId]: {
        network: { edges },
      },
    },
  } = getState();

  edges.forEach((edge) => {
    if (edge.type !== edgeType) {
      dispatch(sessionActions.removeEdge(edge[entityPrimaryKeyProperty]));
    }
  });
};

const resetAppState = () => (dispatch) => {
  dispatch({ type: RESET_STATE });
  // Dispatch deviceReady to re-populate any device defaults.
  // On Cordova, reset is guaranteed to happen after 'deviceready';
  // on other platforms, it's safe to call at any time (even after page load).
  dispatch(deviceActions.deviceReady());
};

const actionCreators = {
  resetAppState,
  resetEdgesOfType,
  resetPropertyForAllNodes,
};

export { actionCreators };
