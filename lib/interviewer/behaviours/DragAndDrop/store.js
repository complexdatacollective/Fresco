import { configureStore } from '@reduxjs/toolkit';
import reducer from './reducer';

const store = configureStore({
  reducer,
  // We need to remove the default middleware to avoid errors related to values that can't be serialized (onDrop functions)
  // We need the thunk middleware, though!
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
