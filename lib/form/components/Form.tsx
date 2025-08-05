import React from 'react';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cn } from '~/utils/shadcn';
import { useForm } from '../hooks/useForm';
import type { FormErrors } from '../types';

/**
 *
 */
type FormProps = {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialValues?: Record<string, unknown>;
  focusFirstInput?: boolean;
  additionalContext?: Record<string, unknown>;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export default function Form(props: FormProps) {
  const { onSubmit, additionalContext, children, className, ...rest } = props;

  const formClasses = cn('flex flex-col gap-4', className);

  const { formProps } = useForm({
    onSubmit,
    onSubmitInvalid: (errors: FormErrors) => {
      scrollToFirstError(errors);
    },
    additionalContext,
  });

  return (
    <form className={formClasses} {...formProps} {...rest}>
      {children}
    </form>
  );
}
