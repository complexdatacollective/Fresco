import { omit } from 'es-toolkit';
import {
  actionTypes,
  type ProtocolWithAssets,
  type SetServerSessionAction,
} from './setServerSession';

const initialState = {} as Record<string, ProtocolWithAssets>;

type Actions = SetServerSessionAction;

export default function reducer(state = initialState, action: Actions) {
  switch (action.type) {
    case actionTypes.setServerSession: {
      if (!action.payload.protocol) {
        return state;
      }

      const { protocol } = action.payload;
      const uid = protocol.id;

      return {
        ...state,
        [uid]: {
          ...omit(protocol, ['id']),
        },
      };
    }
    default:
      return state;
  }
}
