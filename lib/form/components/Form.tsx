'use client';

import { LayoutGroup } from 'motion/react';
import { useId, type ComponentProps } from 'react';
import { focusFirstError } from '~/lib/form/utils/focusFirstError';
import { cx } from '~/utils/cva';
import { useForm } from '../hooks/useForm';
import FormStoreProvider from '../store/formStoreProvider';
import type { FormSubmitHandler } from '../store/types';
import FormErrorsList from './FormErrors';

export type FormProps = {
  onSubmit: FormSubmitHandler;
  children: React.ReactNode;
} & Omit<ComponentProps<'form'>, 'onSubmit' | 'children' | 'submitButton'>;

/**
 * The form element without the store provider wrapper.
 * Use this when you need to manually control the FormStoreProvider placement,
 * such as when SubmitButton needs to be rendered outside the form element
 * (e.g., in a dialog footer).
 *
 * @example
 * ```tsx
 * <FormStoreProvider>
 *   <Dialog footer={<SubmitButton>Save</SubmitButton>}>
 *     <FormWithoutProvider onSubmit={handleSubmit}>
 *       <Field name="email" ... />
 *     </FormWithoutProvider>
 *   </Dialog>
 * </FormStoreProvider>
 * ```
 */
export function FormWithoutProvider(props: FormProps) {
  const { onSubmit, children, className, ...rest } = props;

  const { formProps, formErrors } = useForm({
    onSubmit,
    onSubmitInvalid: (errors) => {
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

/**
 * A complete form component with built-in store provider.
 * Use this for standard forms where all form-related components
 * (including SubmitButton) are descendants of the Form element.
 *
 * For cases where SubmitButton needs to be outside the form element
 * (e.g., in a dialog footer), use FormWithoutProvider with a manual
 * FormStoreProvider wrapper.
 */
export default function Form(props: FormProps) {
  return (
    <FormStoreProvider>
      <FormWithoutProvider {...props} />
    </FormStoreProvider>
  );
}
