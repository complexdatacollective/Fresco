import { configureStore } from '@reduxjs/toolkit';
import logger from './middleware/logger';
import rootReducer from './modules/rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false, // Needed because our dialog implementation includes functions in the action
  }).concat(logger),
  devTools: process.env.NODE_ENV !== 'production',
});

// Taken from https://redux.js.org/usage/usage-with-typescript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
