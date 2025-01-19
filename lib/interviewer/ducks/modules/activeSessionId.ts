import { type Session } from '../../store';
import { actionTypes, type SetServerSessionAction } from './setServerSession';

type SetSessionAction = {
  type: 'SET_SESSION';
  sessionId: string;
};

type EndSessionAction = {
  type: 'END_SESSION';
};

type SessionActionTypes =
  | SetServerSessionAction
  | SetSessionAction
  | EndSessionAction;

// Initial State
const initialState: Session['id'] | null = null;

// Reducer
export default function sessionReducer(
  state = initialState,
  action: SessionActionTypes,
): Session['id'] | null {
  switch (action.type) {
    case actionTypes.setServerSession: {
      return action.payload.id;
    }

    case 'SET_SESSION':
      return action.sessionId;

    case 'END_SESSION':
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
