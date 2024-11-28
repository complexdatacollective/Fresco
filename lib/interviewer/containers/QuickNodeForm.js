import { AnimatePresence, motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { ActionButton, Node } from '~/lib/ui/components';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

const containerVariants = {
  animate: (wide) => wide ? ({
    width: 'var(--open-width)',
    y: '0rem',
    transition: {
      duration: 0,
    },
  }) : ({
    width: 'var(--closed-width)',
    y: '0rem',
    transition: {
      delay: FIRST_LOAD_UI_ELEMENT_DELAY,
    },
  }),
  initial: {
    y: '100%',
  },
};

const itemVariants = {
  show: {
    opacity: 1,
    x: '0px',
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
  hide: {
    opacity: 0,
    x: '10rem',
  },

};

const inputVariants = {
  show: {
    opacity: 1,
    x: '0px',
    width: 'calc(var(--open-width) - 15rem)',
    transition: {
      delay: 0.2,
    },
  },
  hide: {
    opacity: 0,
    x: '4rem',
    width: 'calc(var(--open-width) - 20rem)',
  },
};

const QuickAddForm = ({
  disabled,
  icon,
  nodeColor,
  nodeType,
  newNodeModelData,
  newNodeAttributes,
  targetVariable,
}) => {
  const [showForm, setShowForm] = useState(false);
  const tooltipTimer = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');
  const dispatch = useDispatch();
  
    const addNode = useCallback((...properties) =>
    dispatch(sessionActions.addNode(...properties)), [dispatch]);

  const handleBlur = () => {
    setNodeLabel('');
    setShowForm(false);
  };

  // Handle showing/hiding the tooltip based on the nodeLabel
  // Logic: wait 5 seconds after the user last typed something
  useEffect(() => {
    if (nodeLabel !== '') {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = setTimeout(() => {
        setShowTooltip(true);
      }, 5000);
    } else {
      setShowTooltip(false);
      clearTimeout(tooltipTimer.current);
    }
  }, [nodeLabel]);

  const isValid = useMemo(() => nodeLabel !== '', [nodeLabel]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isValid && !disabled) {
      addNode(
        newNodeModelData,
        {
          ...newNodeAttributes,
          [targetVariable]: nodeLabel,
        },
      );

      setNodeLabel('');
    }
  };

  useEffect(() => {
    if (disabled) {
      setShowForm(false);
      setNodeLabel('');
    }
  }, [disabled]);

  return (
    <motion.div
      className="flip-form"
      variants={containerVariants}
      custom={showForm}
    >
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="form-container"
            className="form-container"
            initial={itemVariants.hide}
            animate={itemVariants.show}
            exit={itemVariants.hide}
          >
            <form autoComplete="off" onSubmit={handleSubmit}>
              <motion.div
                key="tool-tip"
                className="tool-tip"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: showTooltip ? 1 : 0,
                }}
              >
                <span>
                  Press enter to add...
                </span>
              </motion.div>
              <motion.input
                initial={inputVariants.hide}
                animate={inputVariants.show}
                exit={inputVariants.hide}
                className="label-input"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={(e) => setNodeLabel(e.target.value)}
                onBlur={handleBlur}
                placeholder="Type a label and press enter..."
                value={nodeLabel}
                type="text"
              />
            </form>
            <Node
              label={nodeLabel}
              selected={isValid}
              color={nodeColor}
              onClick={handleSubmit}
            />
          </motion.div>
        )}
        {!showForm && (
          <motion.div
            key="button-container"
            className="button-container"
            initial={itemVariants.hide}
            animate={itemVariants.show}
            exit={itemVariants.hide}
          >
            <ActionButton
              disabled={disabled}
              onClick={() => setShowForm(true)}
              icon={icon}
              title={`Add ${nodeType}...`}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};

export default QuickAddForm;
