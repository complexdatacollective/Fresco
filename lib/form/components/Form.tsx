'use client';

import { LayoutGroup, motion } from 'motion/react';
import { type ComponentProps } from 'react';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cx } from '~/utils/cva';
import { useForm } from '../hooks/useForm';
import FormErrorsList from './FormErrors';
import type { FormSubmitHandler } from './types';

type FormProps = {
  onSubmit: FormSubmitHandler;
  children: React.ReactNode;
} & Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'submitButton'>;

export default function Form(props: FormProps) {
  const { onSubmit, children, className, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
      scrollToFirstError(errors);
    },
  });

  return (
    <motion.form
      noValidate // Don't show native HTML validation UI
      className={cx(
        'flex w-screen max-w-2xl flex-col items-start gap-6',
        className,
      )}
      onSubmit={formProps.onSubmit}
      {...rest}
    >
      <LayoutGroup>
        {formErrors && <FormErrorsList key="form-errors" errors={formErrors} />}
        {children}
      </LayoutGroup>
    </motion.form>
  );
}
