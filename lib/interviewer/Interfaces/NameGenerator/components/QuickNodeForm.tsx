import {
  type EntityAttributesProperty,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { motion, type Variants } from 'motion/react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import Form from '~/lib/form/components/Form';

import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '../../utils/constants';

const containerVariants: Variants = {
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

type QuickNodeFormProps = {
  disabled: boolean;
  targetVariable: string;
  onShowForm: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => void;
};

const QuickNodeForm = ({
  disabled,
  _targetVariable,
  _onShowForm,
  addNode,
}: QuickNodeFormProps) => {
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

  return (
    <motion.div
      className="absolute right-0 bottom-0 z-20"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <Form
        onSubmit={handleSubmit}
        initialValues={{}}
        disabled={disabled}
        focusFirstInput={true}
      />
    </motion.div>
  );
};

export default QuickNodeForm;
