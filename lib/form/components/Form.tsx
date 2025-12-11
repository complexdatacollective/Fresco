import type { VariableValue } from '@codaco/shared-consts';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTanStackForm } from '~/lib/form/hooks/useTanStackForm';
import type { FormErrors, ProcessedFormField } from '~/lib/form/types';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';

type FormProps = {
  fields: ProcessedFormField[];
  handleSubmit: (data: { value: Record<string, VariableValue> }) => void;
  getInitialValues?: () =>
    | Record<string, VariableValue>
    | Promise<Record<string, VariableValue>>;
  submitButton?: React.ReactNode;
  disabled?: boolean;
  focusFirstInput?: boolean;
} & React.FormHTMLAttributes<HTMLFormElement>;

const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      fields,
      id,
      handleSubmit,
      getInitialValues,
      submitButton = <button type="submit" key="submit" aria-label="Submit" />,
      disabled,
      focusFirstInput,
      children,
      ...rest
    },
    ref,
  ) => {
    const [initialValues, setInitialValues] = useState<
      Record<string, VariableValue>
    >({});

    // Handle initial values loading
    useEffect(() => {
      if (!getInitialValues) return;

      const loadInitialValues = async () => {
        try {
          const values = await getInitialValues();
          setInitialValues(values);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load initial values:', error);
          setInitialValues({});
        }
      };

      void loadInitialValues();
    }, [getInitialValues]);

    // Create default values from fields and initial values
    const defaultValues = useMemo(() => {
      return fields.reduce<Record<string, VariableValue>>((acc, field) => {
        acc[field.variable] = initialValues[field.variable] ?? '';
        return acc;
      }, {});
    }, [fields, initialValues]);

    const form = useTanStackForm({
      defaultValues,
      onSubmit: handleSubmit,
      onSubmitInvalid: ({ formApi }) => {
        const errors = formApi.getAllErrors().fields as FormErrors;
        scrollToFirstError(errors);
      },
    });

    // Reset form with new values when initial values change
    useEffect(() => {
      if (Object.keys(initialValues).length > 0) {
        form.reset(defaultValues);
      }
    }, [initialValues, defaultValues, form]);

    return (
      <form
        ref={ref}
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        id={id}
        {...rest}
      >
        {fields.map((field, index) => {
          return (
            <form.AppField
              name={field.variable}
              key={`${field.variable}`}
              validators={field.validation}
            >
              {() => (
                <field.Component
                  {...field}
                  disabled={disabled}
                  autoFocus={focusFirstInput && index === 0}
                />
              )}
            </form.AppField>
          );
        })}
        {submitButton}
        {children}
      </form>
    );
  },
);

Form.displayName = 'Form';

export default Form;
