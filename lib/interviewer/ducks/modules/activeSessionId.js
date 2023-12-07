import { actionTypes as SessionsActionTypes, actionCreators as sessionActions } from './session';
import { actionTypes as installedProtocolsActionTypes } from './installedProtocols';
import { SET_SERVER_SESSION } from './setServerSession';

const { ADD_SESSION } = SessionsActionTypes;
const SET_SESSION = 'SET_SESSION';
const END_SESSION = 'END_SESSION';

const initialState = null;

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_SERVER_SESSION: {
      if (!action.payload.session) {
        return state;
      }

      const { id } = action.payload.session;

      return id;
    }
    case SET_SESSION:
    case ADD_SESSION:
      return action.sessionId;
    case END_SESSION:
    case installedProtocolsActionTypes.DELETE_PROTOCOL:
      return initialState;
    default:
      return state;
  }
}

/**
 * setSession can be used to resume an interview (e.g. from GUI, or URL on load)
 */
const setSession = (id) => (dispatch, getState) => {
  const { sessions } = getState();
  if (!sessions[id]) { return; }

  dispatch({
    type: SET_SESSION,
    sessionId: id,
  });
};

const endSession = (alsoDelete = false, markAsFinished = false) => (dispatch, getState) => {
  if (markAsFinished) {
    const { activeSessionId } = getState();
    dispatch(sessionActions.setSessionFinished(activeSessionId));
  }

  dispatch({
    type: END_SESSION,
  });

  console.log('TODO 2: lib/interviewer/ducks/modules/session.js: endSession');
  // push('/'); - need to replace

  if (alsoDelete) {
    const { activeSessionId } = getState();
    dispatch(sessionActions.removeSession(activeSessionId));
  }
};

const actionCreators = {
  endSession,
  setSession,
};

const actionTypes = {
  END_SESSION,
  SET_SESSION,
};

export {
  actionCreators,
  actionTypes,
  initialState,
};
