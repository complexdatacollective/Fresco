import { configureStore } from '@reduxjs/toolkit';
import reducer from './reducer';

const store = configureStore({
  reducer,
  middleware: () => [], // We need to remove the default middleware to avoid errors related to values that can't be serialized (onDrop functions)
});

export default store;
