import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { motion, type Variants } from 'motion/react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { z } from 'zod';
import { Form } from '~/lib/form';
import { type FormSubmitHandler } from '~/lib/form/types';
import { getAdditionalAttributesSelector } from '../../../selectors/prop';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '../../utils/constants';
import QuickAddField from './QuickAddField';

const containerVariants: Variants = {
  animate: {
    y: '0rem',
    opacity: 1,
    transition: {
      delay: FIRST_LOAD_UI_ELEMENT_DELAY,
      when: 'beforeChildren',
    },
  },
  initial: {
    y: '100%',
    opacity: 0,
    transition: {
      when: 'afterChildren',
    },
  },
};

type QuickNodeFormProps = {
  disabled: boolean;
  targetVariable: string;
  onShowForm: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => Promise<void>;
};

const QuickNodeForm = ({
  disabled,
  targetVariable,
  onShowForm,
  addNode,
}: QuickNodeFormProps) => {
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);

  const handleSubmit: FormSubmitHandler = useCallback(
    async (value) => {
      if (!disabled) {
        if (!value[targetVariable]) {
          return {
            success: false,
            errors: {
              form: ['Field is required'],
            },
          };
        }

        await addNode({
          ...newNodeAttributes,
          [targetVariable]: value[targetVariable] as string,
        });

        return {
          success: true,
        };
      }

      return {
        success: false,
        errors: {
          form: ['Form is disabled'],
        },
      };
    },
    [disabled, addNode, newNodeAttributes, targetVariable],
  );

  return (
    <motion.div
      className="absolute right-12 bottom-6 z-20"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      layout
    >
      <Form onSubmit={handleSubmit}>
        <QuickAddField
          name={targetVariable}
          disabled={disabled}
          placeholder="Type a label and press enter..."
          onShowInput={onShowForm}
          validation={z.string().min(2, 'Must be 2 or more characters')}
        />
      </Form>
    </motion.div>
  );
};

export default QuickNodeForm;
