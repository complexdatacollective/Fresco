import { actionTypes as SessionsActionTypes } from './session';
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
