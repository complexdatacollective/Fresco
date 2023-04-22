import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import window from '../window';

const ToastManager = ({
  toasts,
  removeToast,
}) => (
  <div className="toast-container">
    <ul className="toast-container-list">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            dismissHandler={() => {
              if (toast.dismissHandler) {
                toast.dismissHandler();
              }

              removeToast(toast.id);
            }}
            title={toast.title}
            content={toast.content}
            type={toast.type}
            autoDismiss={toast.autoDismiss}
            className={toast.classNames}
            CustomIcon={toast.CustomIcon}
          />
        ))}
      </AnimatePresence>
    </ul>
  </div>
);

ToastManager.propTypes = {
  toasts: PropTypes.array.isRequired,
  removeToast: PropTypes.func.isRequired,
};

export default window(ToastManager);
