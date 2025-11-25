'use client';

import { LayoutGroup, motion } from 'motion/react';
import { type ComponentProps } from 'react';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cx } from '~/utils/cva';
import { useForm } from '../hooks/useForm';
import type { FormSubmitHandler } from '../types';
import FormErrorsList from './FormErrors';

const MotionForm = motion.create('form');

type FormProps = {
  onSubmit: FormSubmitHandler;
  children: React.ReactNode;
} & Omit<
  ComponentProps<typeof MotionForm>,
  'onSubmit' | 'children' | 'submitButton'
>;

export default function Form(props: FormProps) {
  const { onSubmit, children, className, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
      scrollToFirstError(errors);
    },
  });

  return (
    <MotionForm
      noValidate // Don't show native HTML validation UI
      className={cx(
        'flex min-w-md flex-col items-start [&>*:not(:last-child)]:mb-6',
        className,
      )}
      layout
      onSubmit={formProps.onSubmit}
      {...rest}
    >
      <LayoutGroup>
        {formErrors && (
          <FormErrorsList
            key="form-errors"
            errors={formErrors}
            className="mb-6"
          />
        )}
        {children}
      </LayoutGroup>
    </MotionForm>
  );
}
