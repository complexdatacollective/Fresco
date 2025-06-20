import type { ComponentType } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ActionButton } from '~/lib/ui/components';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getNodeTypeLabel, getStageSubject } from '../selectors/session';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';
import TanStackForm from './TanStackForm/Form';

const FORM_NAME = 'quick-add-form';

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

type QuickAddFormProps = {
  disabled: boolean;
  targetVariable: string;
  onShowForm: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const QuickAddForm = ({
  disabled,
  targetVariable,
  onShowForm,
  addNode,
}: QuickAddFormProps) => {
  const [showForm, setShowForm] = useState(false);

  const subject = useSelector(getStageSubject)!;
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const icon = useSelector(getNodeIconName);

  const handleSubmit = useCallback(
    (formData: Record<string, VariableValue>) => {
      if (!disabled) {
        void addNode({
          ...newNodeAttributes,
          ...formData,
        });

        setShowForm(false);
      }
    },
    [disabled, addNode, newNodeAttributes],
  );

  const handleShowForm = useCallback(() => {
    setShowForm(true);
    onShowForm();
  }, [onShowForm]);

  const handleBlur = useCallback(() => {
    setShowForm(false);
  }, []);

  useEffect(() => {
    if (disabled) {
      setShowForm(false);
    }
  }, [disabled]);

  const fields = [
    {
      prompt: undefined,
      variable: targetVariable,
      component: 'QuickAdd' as ComponentType,
      onBlur: handleBlur,
    },
  ];

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
            <TanStackForm
              fields={fields}
              handleFormSubmit={handleSubmit}
              initialValues={{}}
              entityId={undefined} // No entity ID in this context
              autoFocus
              id={FORM_NAME}
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
