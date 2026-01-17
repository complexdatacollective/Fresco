import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { updateStage } from './session';

type UIState = {
  FORM_IS_READY: boolean;
  passphrase: string | null;
  showPassphrasePrompter: boolean;
  passphraseInvalid: boolean;
};

const initialState = {
  FORM_IS_READY: false,
  passphrase: null,
  showPassphrasePrompter: false,
  passphraseInvalid: false,
} as UIState;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFormIsReady: (state, action: PayloadAction<boolean>) => ({
      ...state,
      FORM_IS_READY: action.payload,
    }),
    setPassphrase: (state, action: PayloadAction<string>) => ({
      ...state,
      passphraseInvalid: false,
      passphrase: action.payload,
    }),
    setShowPassphrasePrompter: (state, action: PayloadAction<boolean>) => ({
      ...state,
      showPassphrasePrompter: action.payload,
    }),
    setPassphraseInvalid: (state, action: PayloadAction<boolean>) => ({
      ...state,
      passphraseInvalid: action.payload,
    }),
  },
  extraReducers: (builder) => {
    // Reset showPassphrasePrompter when the stage is updated
    builder.addCase(updateStage, (state) => ({
      ...state,
      showPassphrasePrompter: false,
    }));
  },
  selectors: {
    formIsReady: (state) => state.FORM_IS_READY,
    getPassphrase: (state) => state.passphrase,
    showPassphrasePrompter: (state) =>
      state.showPassphrasePrompter || state.passphraseInvalid,
    getPassphraseInvalid: (state) => state.passphraseInvalid,
  },
});

// Export the reducer
export default uiSlice.reducer;

// Export the action creators
export const {
  setFormIsReady,
  setPassphrase,
  setShowPassphrasePrompter,
  setPassphraseInvalid,
} = uiSlice.actions;

// Export the selectors
export const {
  formIsReady,
  getPassphrase,
  showPassphrasePrompter,
  getPassphraseInvalid,
} = uiSlice.selectors;
