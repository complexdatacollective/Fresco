import {
  type EntityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { useSelector, useStore } from 'react-redux';
import type { RootState } from '../store';
import Form from '~/lib/form/Form';
import { QuickAdd } from '~/lib/form/fields';
import { processProtocolFields } from '~/lib/form/utils/processProtocolFields';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from './Interfaces/utils/constants';

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
  const store = useStore<RootState>();

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

  const processedFields = processProtocolFields({
    fields,
    validationMeta: {}, // No validation metadata needed for quick add
    autoFocus: true,
    state: store.getState(),
  });

  return (
    <motion.div
      className="absolute right-0 bottom-0 z-20"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <Form
        fields={processedFields}
        handleSubmit={handleSubmit}
        getInitialValues={() => ({})}
        disabled={disabled}
        id="quick-add-form"
      />
    </motion.div>
  );
};

export default QuickAddForm;
