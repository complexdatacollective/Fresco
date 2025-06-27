import {
  type EntityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/Form';
import { QuickAdd } from '~/lib/ui/components/Fields';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

const FORM_NAME = 'quick-add-form';

const containerVariants = {
  animate: {
    y: '0rem',
    transition: {
      delay: FIRST_LOAD_UI_ELEMENT_DELAY,
    },
  },
  initial: {
    y: '100%',
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
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);

  const handleSubmit = useCallback(
    ({ value }: { value: Record<string, VariableValue> }) => {
      if (!disabled) {
        void addNode({
          ...newNodeAttributes,
          ...value,
        });
      }
    },
    [disabled, addNode, newNodeAttributes],
  );

  const fields = [
    {
      prompt: undefined,
      variable: targetVariable,
      Component: QuickAdd,
      parameters: {
        onShowForm,
      },
    },
  ];

  return (
    <motion.div
      className="absolute right-0 bottom-0 z-20"
      variants={containerVariants}
      initial="initial"
      animate="animate"
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
  );
};

export default QuickAddForm;
