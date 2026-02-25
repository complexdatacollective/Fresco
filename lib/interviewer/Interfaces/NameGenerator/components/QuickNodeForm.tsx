import {
  type EntityAttributesProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { motion, type Variants } from 'motion/react';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import Form from '~/lib/form/components/Form';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { getPromptAdditionalAttributes } from '~/lib/interviewer/selectors/session';
import QuickAddField from './QuickAddField';

const containerVariants: Variants = {
  animate: {
    y: '0rem',
    opacity: 1,
    transition: {
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
  onShowForm?: () => void;
  addNode: (attributes: NcNode[EntityAttributesProperty]) => Promise<void>;
};

const QuickNodeForm = ({
  disabled,
  targetVariable,
  onShowForm,
  addNode,
}: QuickNodeFormProps) => {
  const newNodeAttributes = useSelector(getPromptAdditionalAttributes);

  const handleSubmit: FormSubmitHandler = useCallback(
    async (values) => {
      const value = values as Record<string, unknown>;
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
    <>
      <div className="pointer-events-none absolute right-0 bottom-0 z-10 h-48 w-xl bg-[radial-gradient(ellipse_at_bottom_right,oklch(from_var(--background)_calc(l-0.1)_c_h),transparent_70%)]" />
      <motion.div
        className="absolute right-12 bottom-6 z-20"
        variants={containerVariants}
        layout
      >
        <Form onSubmit={handleSubmit}>
          <QuickAddField
            name={targetVariable}
            disabled={disabled}
            placeholder="Type a label and press enter..."
            onShowInput={onShowForm ?? undefined}
            required="You must enter a value before pressing enter."
            minLength={1}
          />
        </Form>
      </motion.div>
    </>
  );
};

export default QuickNodeForm;
