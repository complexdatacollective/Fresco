import { configureStore } from '@reduxjs/toolkit';
import reducer from './reducer';

const store = configureStore({
  reducer,
  // configureStore adds some middleware to the store by default
  // https://redux-toolkit.js.org/api/getDefaultMiddleware#intended-usage
});

export default store;
