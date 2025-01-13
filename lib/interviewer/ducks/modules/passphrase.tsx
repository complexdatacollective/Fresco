import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type PassphraseState = {
  value: string;
  isValid: boolean;
  lastUpdated: string;
};

const initialState: PassphraseState = {
  value: '',
  isValid: false,
  lastUpdated: new Date().toISOString(),
};

const passphraseSlice = createSlice({
  name: 'passphrase',
  initialState,
  reducers: {
    setPassphrase: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
      state.isValid = action.payload.length >= 8; // Simple validation example
      state.lastUpdated = new Date().toISOString();
    },
    clearPassphrase: (state) => {
      state.value = '';
      state.isValid = false;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { setPassphrase, clearPassphrase } = passphraseSlice.actions;
export default passphraseSlice.reducer;

// Selector
export const selectPassphrase = (state: { passphrase: PassphraseState }) =>
  state.passphrase.value;
export const selectIsValid = (state: { passphrase: PassphraseState }) =>
  state.passphrase.isValid;
