import { type Session } from '../../store';
import { actionTypes as installedProtocolsActionTypes } from './installedProtocols';
import { SET_SERVER_SESSION } from './setServerSession';

type SetServerSessionAction = {
  type: typeof SET_SERVER_SESSION;
  session: Session;
};

type SetSessionAction = {
  type: 'SET_SESSION';
  sessionId: string;
};

type EndSessionAction = {
  type: 'END_SESSION';
};

type DeleteProtocolAction = {
  type: typeof installedProtocolsActionTypes.DELETE_PROTOCOL;
};

type SessionActionTypes =
  | SetServerSessionAction
  | SetSessionAction
  | EndSessionAction
  | DeleteProtocolAction;

// Initial State
const initialState: Session['id'] | null = null;

// Reducer
export default function sessionReducer(
  state = initialState,
  action: SessionActionTypes,
): Session['id'] | null {
  switch (action.type) {
    case SET_SERVER_SESSION: {
      if (!action.session) {
        return state;
      }
      return action.session.id;
    }

    case 'SET_SESSION':
      return action.sessionId;

    case 'END_SESSION':
    case installedProtocolsActionTypes.DELETE_PROTOCOL:
      return initialState;

    default:
      return state;
  }
}

// Action Creators
export const setSession = (sessionId: string): SetSessionAction => ({
  type: 'SET_SESSION',
  sessionId,
});

export const endSession = (): EndSessionAction => ({
  type: 'END_SESSION',
});
