'use client';

import {
  AnimatePresence,
  type HTMLMotionProps,
  LayoutGroup,
  motion,
} from 'motion/react';
import { useId } from 'react';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { useForm } from '../hooks/useForm';
import type { FormFieldErrors, FormSubmitHandler } from '../types';
import FormErrorsList from './FormErrors';

/**
 *
 */
type FormProps = {
  onSubmit: FormSubmitHandler;
  initialValues?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
  children: React.ReactNode;
} & Omit<HTMLMotionProps<'form'>, 'onSubmit' | 'children'>;

export default function Form(props: FormProps) {
  const id = useId();
  const { onSubmit, initialValues, additionalContext, children, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors: FormFieldErrors) => {
      scrollToFirstError(errors);
    },
    additionalContext,
  });

  return (
    <LayoutGroup id={id}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form key="form" layout onSubmit={formProps.onSubmit} {...rest}>
          {formErrors && formErrors.length > 0 && (
            <FormErrorsList
              key="form-errors"
              errors={formErrors}
              className="mb-6"
            />
          )}
          {children}
        </motion.form>
      </AnimatePresence>
    </LayoutGroup>
  );
}
