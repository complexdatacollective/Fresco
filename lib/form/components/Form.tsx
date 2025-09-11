'use client';

import {
  AnimatePresence,
  type HTMLMotionProps,
  LayoutGroup,
  motion,
} from 'motion/react';
import { useId } from 'react';
import type z from 'zod';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { useForm } from '../hooks/useForm';
import type { FormSubmitHandler } from '../types';
import FormErrorsList from './FormErrors';

/**
 *
 */
type FormProps<T extends z.ZodType> = {
  onSubmit: FormSubmitHandler<T>;
  children: React.ReactNode;
} & Omit<HTMLMotionProps<'form'>, 'onSubmit' | 'children'>;

export default function Form<T extends z.ZodType>(props: FormProps<T>) {
  const id = useId();
  const { onSubmit, children, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
      scrollToFirstError(errors);
    },
  });

  return (
    <LayoutGroup id={id}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.form key="form" layout onSubmit={formProps.onSubmit} {...rest}>
          {formErrors && (
            <FormErrorsList
              key="form-errors"
              errors={formErrors.issues}
              className="mb-6"
            />
          )}
          {children}
        </motion.form>
      </AnimatePresence>
    </LayoutGroup>
  );
}
