import { Dispatch } from 'react';
import { AnyAction } from 'redux';
import { v4 as uuid } from 'uuid';

const OPEN_DIALOG = 'PROTOCOL/OPEN_DIALOG';
const CLOSE_DIALOG = 'PROTOCOL/CLOSE_DIALOG';

type BaseDialog = {
  type: 'Confirm' | 'Notice' | 'Warning' | 'Error',
  title: string,
  message: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  confirmLabel?: string,
  cancelLabel?: string,
  showIcon?: boolean,
}

type ConfirmDialog = BaseDialog & {
  type: 'Confirm',
}

type NoticeDialog = BaseDialog & {
  type: 'Notice',
}

type WarningDialog = BaseDialog & {
  type: 'Warning',
}

type ErrorDialog = BaseDialog & {
  type: 'Error',
  additionalInfo?: string,
}

export type Dialog = ConfirmDialog | NoticeDialog | WarningDialog | ErrorDialog;

type DialogInState = Dialog & {
  id: string,
}


const initialState: DialogInState[] = [];

const openDialog = (dialog: Dialog) => (dispatch: Dispatch<AnyAction>) => new Promise((resolve) => {
  const onConfirm = () => {
    if (dialog.onConfirm) { dialog.onConfirm(); }
    resolve(true);
  };

  const onCancel = () => {
    // If the dialog has an onCancel callback, call it
    if (dialog.onCancel) { dialog.onCancel(); }
    resolve(false);
  };

  dispatch({
    id: uuid(),
    type: OPEN_DIALOG,
    dialog: {
      ...dialog,
      onConfirm,
      onCancel,
    },
  });
});

const closeDialog = (id: string) => ({
  type: CLOSE_DIALOG,
  id,
});

function reducer(state = initialState, action: AnyAction) {
  switch (action.type) {
    case OPEN_DIALOG:
      return [
        ...state,
        { id: action.id, ...action.dialog },
      ];
    case CLOSE_DIALOG:
      return [
        ...state.filter((dialog) => dialog.id !== action.id),
      ];
    default:
      return state;
  }
}

const actionCreators = {
  openDialog,
  closeDialog,
};

const actionTypes = {
  OPEN_DIALOG,
  CLOSE_DIALOG,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
