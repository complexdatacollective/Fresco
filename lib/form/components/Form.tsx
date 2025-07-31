import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { Button } from '~/lib/ui/components';
import { cn } from '~/utils/shadcn';

export function SubmitButton() {
  return <Button type="submit" key="submit" aria-label="Submit" />;
}

/**
 *
 */

import { Form as BaseForm } from '@base-ui-components/react/form';

type FormProps = {
  onSubmit: (data: Record<string, unknown>) => void;
  initialValues?: Record<string, unknown>;
  focusFirstInput?: boolean;
} & React.FormHTMLAttributes<HTMLFormElement>;

export const Form = (props: FormProps) => {
  const { onSubmit, initialValues, focusFirstInput, children, className } =
    props;

  const formClasses = cn('flex flex-col gap-4', className);

  // Field context is used to provide additional data to fields, such as external data or form state
  // This is a mock context for demonstration purposes. Actual context will come from elsewhere.
  const fieldContext = {
    externalData: 234234,
  };

  const { formProps } = useForm({
    initialValues,
    onSubmit,
    onSubmitInvalid: ({ errors }) => {
      scrollToFirstError(errors);
    },
    focusFirstInput,
    fieldContext,
  });

  return (
    <FormContext.Provider value={formContext}>
      <BaseForm className={formClasses} {...formProps}>
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
export function Field({
  name,
  initialValue,
  validation,
  Component,
  ...additionalFieldProps
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  initialValue?: unknown;
  validation?:
    | z.ZodTypeAny
    | ((context: {
        formContext: unknown;
        fieldContext: unknown;
      }) => z.ZodTypeAny);
  Component: React.ElementType;
}) {
  const id = useId();

  /**
   * This hook connects the field to the form context, backed by the zustand
   * store. The store tracks field state, the hook handles subscription to
   * changes, and provides the necessary props to the field component.
   */
  const fieldProps = useField({
    id,
    name,
    initialValue,
    validation,
  });

  return (
    <div className="" data-field-name={name} data-field-id={id}>
      <Component name={name} {...additionalFieldProps} {...fieldProps} />
    </div>
  );
}

/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */

import { Field as BaseField } from '@base-ui-components/react/field';
import { Input } from '@base-ui-components/react/input';
import { useId } from 'react';
import { z } from 'zod';

// Props that all fields compatible with this system can handle
type BaseFieldProps = {
  name: string;
  label: string;
  hint?: string;
  isValid: boolean;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function InputField({
  name,
  placeholder,
  value,
  onChange,
  isValid,
  error,
  label,
  hint,
}: BaseFieldProps & {}) {
  return (
    <BaseField.Root invalid={!isValid} className="flex flex-col gap-2">
      <BaseField.Label className="text-sm font-medium">{label}</BaseField.Label>
      {hint && (
        <BaseField.Description className="text-muted-foreground text-xs">
          {hint}
        </BaseField.Description>
      )}
      <Input
        name={name}
        placeholder={placeholder}
        value={value}
        onValueChange={onChange}
        className=""
      />
      {error && (
        <BaseField.Error className="text-red-500">{error}</BaseField.Error>
      )}
    </BaseField.Root>
  );
}

export function ExampleForm() {
  const handleSubmit = (data) => {
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
        validation={({ formContext }) =>
          z.string().email('Invalid email address')
        }
      />
      <Field
        name="age"
        hint="Enter your age. You must be 18 or older."
        label="Age"
        Component={InputField}
        additionalFieldProps={{ type: 'number' }}
        placeholder="Enter your age"
        validation={() =>
          z.number().min(18, 'You must be at least 18 years old')
        }
      />
      <SubmitButton />
    </Form>
  );
}
