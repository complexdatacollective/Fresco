import { configureStore } from '@reduxjs/toolkit';
import logger from './middleware/logger';
import rootReducer from './modules/rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  devTools: process.env.NODE_ENV !== 'production',
});
