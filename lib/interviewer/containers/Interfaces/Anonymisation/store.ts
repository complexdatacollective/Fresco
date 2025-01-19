import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import logger from "redux-logger";

type EncryptionState = {
  passphrase: string | null;
}

const initialState = { passphrase: null } satisfies EncryptionState as EncryptionState

const rootReducer = createSlice({
  name: 'encryption',
  initialState,
  reducers: {
    setPassphrase: (state, action: PayloadAction<string>) => {
      state.passphrase = action.payload;
    },
    clearPassphrase: (state) => {
      state.passphrase = null;
    }
  }
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch