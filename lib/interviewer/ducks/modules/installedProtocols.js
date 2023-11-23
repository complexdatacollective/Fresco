import React from 'react';
import { omit, findKey, get } from 'lodash';
import { actionCreators as dialogActions } from './dialogs';
import { withErrorDialog } from './errors';

const IMPORT_PROTOCOL_COMPLETE = 'IMPORT_PROTOCOL_COMPLETE';
const IMPORT_PROTOCOL_FAILED = 'IMPORT_PROTOCOL_FAILED';
const DELETE_PROTOCOL = 'INSTALLED_PROTOCOLS/DELETE_PROTOCOL';

const initialState = {
  '1': {
    name: 'test protocol',
    stages: [{
      "id": "1151e210-7969-11ee-a112-2fa2ba6c2d8e",
      "type": "Information",
      "items": [
        {
          "id": "b21c9dca-fa6a-40a2-8652-ec542939f71c",
          "size": "MEDIUM",
          "type": "text",
          "content": "We can render text.\n\n<br>\n\n\nThe text has **markdown**!\n\n<br>\n\n\n\n- Including a\n- list!\n\n"
        },
        {
          "id": "ae526a7f-28d5-4c75-a5eb-c30a0b263bcd",
          "size": "MEDIUM",
          "type": "asset",
          "content": "38dc9035-02b4-4906-b0c5-9849415960fe"
        }
      ],
      "label": "Information Interface",
      "title": "Information Interface"
    }],
    codebook: {},
  }
};

const protocolHasSessions = (state, protocolUID) => new Promise((resolve) => {
  const hasNotExportedSession = !!findKey(
    state.sessions,
    (session) => session.protocolUID === protocolUID && !session.exportedAt,
  );

  const hasSession = !!findKey(
    state.sessions,
    (session) => session.protocolUID === protocolUID,
  );

  const protocolName = get(state, ['installedProtocols', protocolUID, 'name'], null);

  resolve({ hasSession, hasNotExportedSession, protocolName });
});

const hasNonExportedSessionDialog = (protocolName) => ({
  type: 'Warning',
  title: `Interviews using '${protocolName}' have not been exported`,
  message: (
    <>
      <p>
        There are interview sessions on this device using the protocol &apos;
        {protocolName}
        &apos; that have
        not yet been exported.
      </p>
      <p><strong>Deleting this protocol will also delete these sessions.</strong></p>
    </>
  ),
  confirmLabel: 'Delete protocol and sessions',
});

const hasSessionDialog = (protocolName) => ({
  type: 'Confirm',
  title: `Interviews using ${protocolName}`,
  message: (
    <>
      <p>
        There are interview sessions on this device that use the protocol &apos;
        {protocolName}
        &apos;.
      </p>
      <p><strong>Deleting this protocol will also delete these sessions.</strong></p>
    </>
  ),
  confirmLabel: 'Delete protocol and sessions',
});

const deleteProtocolAction = (protocolUID) => (dispatch, getState) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  protocolHasSessions(getState(), protocolUID)
    .then(({ hasSession, hasNotExportedSession, protocolName }) => {
      if (hasNotExportedSession) {
        return dispatch(dialogActions.openDialog(hasNonExportedSessionDialog(protocolName)));
      }

      if (hasSession) {
        return dispatch(dialogActions.openDialog(hasSessionDialog(protocolName)));
      }

      return Promise.resolve(true);
    })
    .then((confirmed) => {
      if (!confirmed) { return; }
      dispatch({ type: DELETE_PROTOCOL, protocolUID });
    });

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
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

function importProtocolCompleteAction(protocolData) {
  return {
    type: IMPORT_PROTOCOL_COMPLETE,
    protocolData,
  };
}

const importProtocolFailedAction = withErrorDialog((error) => ({
  type: IMPORT_PROTOCOL_FAILED,
  error,
}));

const actionTypes = {
  DELETE_PROTOCOL,
  IMPORT_PROTOCOL_COMPLETE,
  IMPORT_PROTOCOL_FAILED,
};

const actionCreators = {
  deleteProtocol: deleteProtocolAction,
  importProtocolCompleteAction,
  importProtocolFailedAction,
};

export {
  actionCreators,
  actionTypes,
};
