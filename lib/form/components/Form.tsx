import {
  AnimatePresence,
  type HTMLMotionProps,
  LayoutGroup,
  motion,
} from 'motion/react';
import { useId } from 'react';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cx } from '~/utils/cva';
import { useForm } from '../hooks/useForm';
import type { FormErrors } from '../types';

/**
 *
 */
type FormProps = {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialValues?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
} & HTMLMotionProps<'form'>;

export default function Form(props: FormProps) {
  const id = useId();
  const { onSubmit, additionalContext, children, className, ...rest } = props;

  const formClasses = cx('', className);

  const { formProps } = useForm({
    onSubmit,
    onSubmitInvalid: (errors: FormErrors) => {
      scrollToFirstError(errors);
    },
    additionalContext,
  });

  return (
    <LayoutGroup id={id}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form
          className={formClasses}
          layout
          onSubmit={formProps.onSubmit}
          {...rest}
        >
          {children}
        </motion.form>
      </AnimatePresence>
    </LayoutGroup>
  );
}
