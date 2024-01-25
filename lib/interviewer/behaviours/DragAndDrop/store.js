import thunk from 'redux-thunk';
import reducer from './reducer';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer,
  middleware: [thunk],
});

export default store;
