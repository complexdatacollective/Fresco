import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';

export interface Dialog {
  id: string;
  type: 'Confirm' | 'Notice' | 'Warning' | 'Error';
  title: string;
  message: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
}

const initialState: Dialog[] = [
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
];

// Async thunk for opening dialog with Promise resolution
export const openDialog = createAsyncThunk(
  'dialogs/open',
  async (dialog: Omit<Dialog, 'id'>, { dispatch }) => {
    return new Promise<boolean>((resolve) => {
      const id = uuid();

      const onConfirm = () => {
        if (dialog.onConfirm) {
          dialog.onConfirm();
        }
        dispatch(closeDialog(id));
        resolve(true);
      };

      const onCancel = () => {
        if (dialog.onCancel) {
          dialog.onCancel();
        }
        dispatch(closeDialog(id));
        resolve(false);
      };

      // Add the dialog to state
      dispatch(
        dialogsSlice.actions.addDialog({
          id,
          ...dialog,
          onConfirm,
          onCancel,
        }),
      );

      // return id; // Return ID for potential later reference
    });
  },
);

const dialogsSlice = createSlice({
  name: 'dialogs',
  initialState,
  reducers: {
    addDialog: (state, action: PayloadAction<Dialog>) => {
      // Redux Toolkit uses Immer under the hood, so we can "mutate" state
      state.push(action.payload);
    },
    closeDialog: (state, action: PayloadAction<string>) => {
      // Return an array without the dialog with the specified ID
      return state.filter((dialog) => dialog.id !== action.payload);
    },
  },
});

// Export the action creator separately for direct use
export const { closeDialog } = dialogsSlice.actions;

// Export the reducer
export default dialogsSlice.reducer;
