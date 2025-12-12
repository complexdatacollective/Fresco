'use client';

import { LayoutGroup } from 'motion/react';
import { useId, type ComponentProps } from 'react';
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

  const id = useId();

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
      scrollToFirstError(errors);
    },
  });

  return (
    <form
      noValidate // Don't show native HTML validation UI
      className={cx('flex w-full flex-col items-start gap-6', className)}
      onSubmit={formProps.onSubmit}
      {...rest}
    >
      <LayoutGroup id={id}>
        {formErrors && <FormErrorsList key="form-errors" errors={formErrors} />}
        {children}
      </LayoutGroup>
    </form>
  );
}
