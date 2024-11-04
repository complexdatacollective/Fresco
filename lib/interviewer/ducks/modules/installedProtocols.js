import { findKey, omit } from 'lodash-es';
import { SET_SERVER_SESSION } from './setServerSession';

const IMPORT_PROTOCOL_COMPLETE = 'IMPORT_PROTOCOL_COMPLETE';
const IMPORT_PROTOCOL_FAILED = 'IMPORT_PROTOCOL_FAILED';
const DELETE_PROTOCOL = 'INSTALLED_PROTOCOLS/DELETE_PROTOCOL';

const initialState = {};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_SERVER_SESSION: {
      if (!action.payload.protocol) { return state; }

      const { protocol } = action.payload;
      const uid = protocol.id;

      return {
        ...state,
        [uid]: {
          ...omit(protocol, 'id'),
          installationDate: Date.now(),
        },
      };
    }
    case DELETE_PROTOCOL:
      return omit(state, [action.protocolUID]);
    case IMPORT_PROTOCOL_COMPLETE: {
      const newProtocol = action.protocolData;

      // If the protocol name (which is the true UID of protocol) already exists,
      // overwrite. We only get here after user has confirmed.
      const existingIndex = findKey(state, (protocol) => protocol.name === newProtocol.name);

      if (existingIndex) {
        return {
          ...state,
          [existingIndex]: {
            ...omit(newProtocol, 'uid'),
            installationDate: Date.now(),
          },
        };
      }

      return {
        ...state,
        [newProtocol.uid]: {
          ...omit(newProtocol, 'uid'),
          installationDate: Date.now(),
        },
      };
    }
    default:
      return state;
  }
}


const actionTypes = {
  DELETE_PROTOCOL,
  IMPORT_PROTOCOL_COMPLETE,
  IMPORT_PROTOCOL_FAILED,
};

export {
  actionTypes
};

