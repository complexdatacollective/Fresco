import { type Dispatch } from '@reduxjs/toolkit';
import { type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';

export const OPEN_DIALOG = Symbol('PROTOCOL/OPEN_DIALOG');
export const CLOSE_DIALOG = Symbol('PROTOCOL/CLOSE_DIALOG');

export type OpenDialogAction = {
  type: typeof OPEN_DIALOG;
  id: string;
  dialog: Omit<Dialog, 'id'>;
};

type CloseDialogAction = {
  type: typeof CLOSE_DIALOG;
  id: Dialog['id'];
};

type Action = OpenDialogAction | CloseDialogAction;

export type Dialog = {
  id: string;
  type: 'Confirm' | 'Notice' | 'Warning' | 'Error';
  title: string;
  message: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const initialState = [
  // {
  //   id: '1234-1234-1',
  //   type: 'Confirm',
  //   title: 'Something to confirm',
  //   message: 'More detail about confirmation',
  //   confirmLabel: 'Yes please!',
  //   onConfirm: () => {},
  //   onCancel: () => {},
  // },
  // {
  //   id: '1234-1234-2',
  //   type: 'Notice',
  //   title: 'Something info for the user',
  //   message: 'More detail...',
  //   onConfirm: () => {},
  // },
  // {
  //   id: '1234-1234-3',
  //   type: 'Warning',
  //   title: 'Something to warn the user about, maybe a non-failing error',
  //   message: 'More detail...',
  //   onConfirm: () => {},
  // },
  // {
  //   id: '1234-1234-4',
  //   type: 'Error',
  //   error: new Error('message and title are automatic'),
  //   onConfirm: () => {},
  //   onCancel: () => {},
  // },
] as Dialog[];

export const openDialog = (dialog: Dialog) => (dispatch: Dispatch) =>
  new Promise((resolve) => {
    const onConfirm = () => {
      if (dialog.onConfirm) {
        dialog.onConfirm();
      }
      resolve(true);
    };

    const onCancel = () => {
      if (dialog.onCancel) {
        dialog.onCancel();
      }
      resolve(false);
    };

    dispatch<OpenDialogAction>({
      id: uuid(),
      type: OPEN_DIALOG,
      dialog: {
        ...dialog,
        onConfirm,
        onCancel,
      },
    });
  });

const closeDialog = (id: Dialog['id']) => ({
  type: CLOSE_DIALOG,
  id,
});

function reducer(state = initialState, action: Action): Dialog[] {
  switch (action.type) {
    case OPEN_DIALOG:
      return [...state, { id: action.id, ...action.dialog }];
    case CLOSE_DIALOG:
      return [...state.filter((dialog) => dialog.id !== action.id)];
    default:
      return state;
  }
}

const actionCreators = {
  openDialog,
  closeDialog,
};

export { actionCreators };

export default reducer;
