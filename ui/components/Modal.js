import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import Drop from './Transitions/Drop';
import { getCSSVariableAsNumber } from '../utils/CSSVariables';
import usePortal from '../hooks/usePortal';

const Modal = (props) => {
  const { children, show, zIndex, onBlur } = props;

  const Portal = usePortal();

  const style = zIndex ? { zIndex } : null;

  const handleBlur = useCallback(
    (event) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      onBlur(event);
    },
    [onBlur],
  );

  const variants = useMemo(
    () => ({
      visible: {
        opacity: 1,
        transition: {
          duration: getCSSVariableAsNumber('--animation-duration-fast'),
        },
      },
      hidden: {
        opacity: 0,
      },
    }),
    [],
  );

  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <motion.div
            className="modal"
            style={style}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="modal__background" />
            <div className="modal__content" onClick={handleBlur}>
              <Drop>{children}</Drop>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};

Modal.propTypes = {
  show: PropTypes.bool,
  children: PropTypes.node,
  zIndex: PropTypes.number,
  onBlur: PropTypes.func,
};

Modal.defaultProps = {
  show: false,
  zIndex: null,
  children: null,
  onBlur: () => { },
};

export default Modal;
