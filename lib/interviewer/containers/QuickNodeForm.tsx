import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { addNode as addNodeAction } from '~/lib/interviewer/ducks/modules/session';
import { ActionButton, Node } from '~/lib/ui/components';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import {
  getNodeColor,
  getNodeTypeLabel,
  getStageSubject,
} from '../selectors/session';
import { useAppDispatch } from '../store';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

const containerVariants = {
  animate: (wide: boolean) =>
    wide
      ? {
          width: 'var(--open-width)',
          y: '0rem',
          transition: {
            duration: 0,
          },
        }
      : {
          width: 'var(--closed-width)',
          y: '0rem',
          transition: {
            delay: FIRST_LOAD_UI_ELEMENT_DELAY,
          },
        },
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

type QuickAddFormProps = {
  disabled: boolean;
  targetVariable: string;
  onShowForm: () => void;
};

const QuickAddForm = ({
  disabled,
  targetVariable,
  onShowForm,
}: QuickAddFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const tooltipTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [showTooltip, setShowTooltip] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const nodeColor = useSelector(getNodeColor(subject.type));
  const icon = useSelector(getNodeIconName);

  const dispatch = useAppDispatch();

  const addNode = useCallback(
    (attributes: NcNode[EntityAttributesProperty]) =>
      dispatch(
        addNodeAction({
          type: subject.type,
          attributeData: attributes,
        }),
      ),
    [dispatch, subject],
  );

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

  const handleSubmit = () => {
    if (isValid && !disabled) {
      void addNode({
        ...newNodeAttributes,
        [targetVariable]: nodeLabel,
      });

      setNodeLabel('');
    }
  };

  const handleShowForm = useCallback(() => {
    setShowForm(true);
    onShowForm();
  }, [onShowForm]);

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
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
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
                <span>Press enter to add...</span>
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
              handleClick={handleSubmit}
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
              onClick={handleShowForm}
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
