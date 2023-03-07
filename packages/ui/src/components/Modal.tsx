import type { ReactNode, FocusEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCSSVariableAsNumber } from '../utils/CSSVariables';

type ModalProps = {
  show: boolean,
  zIndex?: number | null,
  onBlur: (event: FocusEvent<HTMLElement>) => void,
  children: ReactNode
};

function Modal({
  children, show, zIndex = null, onBlur,
}: ModalProps) {
  const style = zIndex ? { zIndex } : undefined;

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) { return; }
    onBlur(event);
  };

  const variants = {
    visible: {
      opacity: 1,
      transition: {
        duration: getCSSVariableAsNumber('--animation-duration-fast'),
        when: 'beforeChildren',
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        when: 'afterChildren',
      },
    },
  };

  return (
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
          <div className="modal__content" onBlur={handleBlur}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
