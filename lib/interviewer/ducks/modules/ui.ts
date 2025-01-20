import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {} as Record<string, unknown>;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<Record<string, unknown>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    toggle: (state, action: PayloadAction<string>) => {
      state[action.payload] = !state[action.payload];
    },
  },
});

// Export the reducer
export default uiSlice.reducer;

// Export the action creators
export const { update, toggle } = uiSlice.actions;

// If you want to keep the same export structure as before:
export const actionCreators = {
  update: uiSlice.actions.update,
  toggle: uiSlice.actions.toggle,
};
