import { type z } from 'zod';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';
import { cn } from '~/utils/shadcn';
import { FormContext } from '../context/FormContext';
import { useField } from '../hooks/useField';
import { useForm } from '../hooks/useForm';
import type { FormErrors, ValidationContext } from '../types';

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

type FormProps<TContext = unknown> = {
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialValues?: Record<string, unknown>;
  focusFirstInput?: boolean;
  additionalContext?: TContext;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export function Form<TContext = unknown>(props: FormProps<TContext>) {
  const {
    onSubmit,
    focusFirstInput,
    additionalContext,
    children,
    className,
    ...rest
  } = props;

  const formClasses = cn('flex flex-col gap-4', className);

  const { formProps, context } = useForm<TContext>({
    name: 'form', // Will be overridden by useId in useForm
    onSubmit,
    onSubmitInvalid: (errors: FormErrors) => {
      scrollToFirstError(errors);
    },
    focusFirstInput,
    additionalContext,
  });

  return (
    <FormContext.Provider value={context}>
      <BaseForm
        className={formClasses}
        {...formProps}
        {...rest}
        errors={context.errors}
      >
        {children}
      </BaseForm>
    </FormContext.Provider>
  );
}

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
export function Field<
  TFieldProps extends Record<string, any> = Record<string, any>,
  TContext = unknown,
>({
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
    | ((context: ValidationContext<TContext>) => z.ZodTypeAny);
  Component: React.ElementType;
} & TFieldProps) {
  /**
   * This hook connects the field to the form context, backed by the zustand
   * store. The store tracks field state, the hook handles subscription to
   * changes, and provides the necessary props to the field component.
   */
  const fieldProps = useField<TContext>({
    name,
    initialValue,
    validation,
  });

  return <Component name={name} {...fieldProps} {...additionalFieldProps} />;
}

/**
 * Example of a simple controlled component, designed to be used with Field and Form
 */

import { Field as BaseField } from '@base-ui-components/react/field';
import { Input } from '@base-ui-components/react/input';
import { type InputHTMLAttributes } from 'react';

// Props that all fields compatible with this system can handle
type BaseFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  meta: {
    label: string;
    hint?: string;
    isValid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    isValidating?: boolean;
    error?: string;
  };
  onChange: (value: string) => void;
  name: string;
  value?: string;
};

export function InputField({
  name,
  meta: { isValid, isTouched, error, label, hint },
  onChange,
  ...inputProps
}: BaseFieldProps) {
  const inputClasses = cn(
    'rounded border border-border px-3 py-2',
    !isValid && isTouched && 'border-destructive',
    isValid && 'border-success',
  );

  return (
    <BaseField.Root
      invalid={!isValid}
      name={name}
      className="flex flex-col gap-2"
    >
      <BaseField.Label className="text-sm font-medium">{label}</BaseField.Label>
      {hint && (
        <BaseField.Description className="text-muted-foreground text-xs">
          {hint}
        </BaseField.Description>
      )}
      <Input
        name={name}
        onValueChange={(value: string) => {
          onChange(value);
        }}
        {...inputProps}
        className={inputClasses}
      />
      <BaseField.Error className="text-destructive text-sm">
        <p>{error}</p>
      </BaseField.Error>
    </BaseField.Root>
  );
}

export { Form as default };
