import { z } from 'zod';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cn } from '~/utils/shadcn';
import { FormContext } from '../context/FormContext';
import { useField } from '../hooks/useField';
import { useForm } from '../hooks/useForm';
import type { FormErrors } from '../types';

export function SubmitButton() {
  return (
    <button
      type="submit"
      key="submit"
      aria-label="Submit"
      className="bg-accent text-accent-foreground rounded-xl p-2"
    >
      Submit
    </button>
  );
}

/**
 *
 */

import { Form as BaseForm } from '@base-ui-components/react/form';

type FormProps = {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialValues?: Record<string, unknown>;
  focusFirstInput?: boolean;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export const Form = (props: FormProps) => {
  const { onSubmit, focusFirstInput, children, className, ...rest } = props;

  const formClasses = cn('flex flex-col gap-4', className);

  // Field context is used to provide additional data to fields, such as external data or form state
  // This is a mock context for demonstration purposes. Actual context will come from elsewhere.
  const fieldContext = {
    externalData: 234234,
  };

  const { formProps, formContext } = useForm({
    onSubmit,
    onSubmitInvalid: (errors: FormErrors) => {
      scrollToFirstError(errors);
    },
    focusFirstInput,
    fieldContext,
  });

  console.log('Form context:', formContext);

  return (
    <FormContext.Provider value={formContext}>
      <BaseForm
        className={formClasses}
        {...formProps}
        {...rest}
        errors={formContext.errors}
      >
        {children}
      </BaseForm>
    </FormContext.Provider>
  );
};

/**
 * Wrapper that connects a field to the form context, and handles validation
 * and state.
 *
 * additionalFieldProps should be typed to match the specific field component
 * being used, allowing for additional props to be passed through.
 *
 * It would be ideal if FormContextType and FieldContextType were able to be
 * inferred somehow.
 */
export function Field<T extends Record<string, any> = Record<string, any>>({
  name,
  initialValue,
  validation,
  Component,
  ...additionalFieldProps
}: {
  name: string;
  initialValue?: unknown;
  validation?:
    | z.ZodTypeAny
    | ((context: {
        formContext: unknown;
        fieldContext: unknown;
      }) => z.ZodTypeAny);
  Component: React.ElementType;
} & T) {
  /**
   * This hook connects the field to the form context, backed by the zustand
   * store. The store tracks field state, the hook handles subscription to
   * changes, and provides the necessary props to the field component.
   */
  const fieldProps = useField({
    name,
    initialValue,
    validation,
  });

  return (
    <Component
      name={name}
      {...fieldProps}
      {...additionalFieldProps}
      data-field-name={name}
    />
  );
}

/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */

import { Field as BaseField } from '@base-ui-components/react/field';
import { Input } from '@base-ui-components/react/input';
import { type InputHTMLAttributes } from 'react';

// Props that all fields compatible with this system can handle
type BaseFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  isValid: boolean;
  isTouched: boolean;
  isDirty: boolean;
  isValidating?: boolean;
  error?: string;
  onBlur: () => void;
};

export function InputField({
  name,
  isValid,
  isTouched,
  isDirty,
  isValidating,
  label,
  error,
  hint,
  ...inputProps
}: BaseFieldProps) {
  return (
    <BaseField.Root name={name} className="flex flex-col gap-2">
      <BaseField.Label className="text-sm font-medium">{label}</BaseField.Label>
      {hint && (
        <BaseField.Description className="text-muted-foreground text-xs">
          {hint}
        </BaseField.Description>
      )}
      <Input
        name={name}
        {...inputProps}
        className="rounded border border-gray-300 px-3 py-2"
      />
      <BaseField.Error className="text-destructive text-sm">
        <p>{error}</p>
      </BaseField.Error>
    </BaseField.Root>
  );
}

// Default export for backwards compatibility
export default Form;

export function ExampleForm() {
  const handleSubmit = (data: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.log('Form submitted with data:', data);
  };

  return (
    <Form
      onSubmit={handleSubmit}
      initialValues={{ email: '', age: '' }}
      focusFirstInput
    >
      <Field
        name="email"
        label="Email"
        placeholder="Enter your email"
        hint="We'll never share your email."
        Component={InputField}
        validation={({ formContext: _formContext }) =>
          z.string().email('Invalid email address')
        }
      />
      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        placeholder="Enter your age"
        validation={() =>
          z.string().refine((val) => {
            const num = parseInt(val, 10);
            return !isNaN(num) && num >= 18;
          }, 'You must be at least 18 years old')
        }
      />
      <SubmitButton />
    </Form>
  );
}
