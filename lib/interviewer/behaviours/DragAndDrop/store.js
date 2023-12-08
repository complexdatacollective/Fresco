import thunk from 'redux-thunk';
import reducer from './reducer';
import logger from '../../ducks/middleware/logger';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer,
  middleware: [thunk, logger],
});

export default store;
