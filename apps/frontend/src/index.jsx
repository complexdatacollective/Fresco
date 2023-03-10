import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Spinner } from '@codaco/ui';
import { store } from './ducks/store';
import { actionCreators as deviceActions } from './ducks/modules/deviceSettings';
import App from './App';
import { RouterProvider } from 'react-router-dom';
import router from './routes/router';

// This prevents user from being able to drop a file anywhere on the app
document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

const startApp = () => {
  store.dispatch(deviceActions.deviceReady());
  const container = document.getElementById('root');
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App>
          <RouterProvider router={router} fallbackElement={<Spinner />} />
        </App>
      </Provider>
    </React.StrictMode>,
  );
};

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    startApp();
  }
}
