import {
  type EntityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/Form';
import { ActionButton } from '~/lib/ui/components';
import { QuickAdd } from '~/lib/ui/components/Fields';
import { getNodeIconName } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getNodeTypeLabel, getStageSubject } from '../selectors/session';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

const FORM_NAME = 'quick-add-form';

const containerVariants = {
  animate: (wide: boolean) =>
    wide
      ? {
          width: '40rem',
          y: '0rem',
          transition: {
            duration: 0,
          },
        }
      : {
          width: '13rem',
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
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!disabled) {
        void addNode({
          ...newNodeAttributes,
          ...value,
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
      Component: QuickAdd,
      onBlur: handleBlur,
    },
  ];

  return (
    <motion.div
      className="absolute right-0 bottom-0 z-20 flex h-44 w-52 items-center"
      variants={containerVariants}
      custom={showForm}
    >
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="form-container"
            className="absolute right-3 -mt-7"
            initial={itemVariants.hide}
            animate={itemVariants.show}
            exit={itemVariants.hide}
          >
            <Form
              fields={fields}
              handleFormSubmit={handleSubmit}
              initialValues={{}}
              entityId={undefined} // No entity ID in this context
              autoFocus
              disabled={disabled}
              id={FORM_NAME}
            />
          </motion.div>
        )}
        {!showForm && (
          <motion.div
            key="button-container"
            className="absolute right-3 mr-8"
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
