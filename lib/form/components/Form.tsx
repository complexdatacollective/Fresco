'use client';

import { LayoutGroup } from 'motion/react';
import { useId, type ComponentProps } from 'react';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { cx } from '~/utils/cva';
import { useForm } from '../hooks/useForm';
import { FormStoreProvider } from '../store/formStoreProvider';
import FormErrorsList from './FormErrors';
import type { FormSubmitHandler } from './types';

type FormProps = {
  onSubmit: FormSubmitHandler;
  children: React.ReactNode;
} & Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'submitButton'>;

function FormInner(props: FormProps) {
  const { onSubmit, children, className, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
      console.error('Form submission failed:', errors);
      focusFirstError(errors);
    },
  });

  const id = useId();

  return (
    <form
      noValidate // Don't show native HTML validation UI
      className={cx('w-full', className)}
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

export default function Form(props: FormProps) {
  return (
    <FormStoreProvider>
      <FormInner {...props} />
    </FormStoreProvider>
  );
}
