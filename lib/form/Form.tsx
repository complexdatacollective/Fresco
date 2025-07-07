import type { VariableValue } from '@codaco/shared-consts';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useTanStackForm } from '~/lib/form/hooks/useTanStackForm';
import type { FormErrors, FormProps } from '~/lib/form/types';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';

const Form = ({
  fields,
  handleSubmit,
  getInitialValues,
  submitButton = <button type="submit" key="submit" aria-label="Submit" />,
  disabled,
  id,
}: FormProps) => {
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
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        id={id}
      >
        {fields.map((field, index) => {
          if (!field.Component) {
            throw new Error(
              `Component not resolved for field: ${field.variable}`,
            );
          }

          const FieldComponent = field.Component;

          return (
            <form.AppField
              name={field.variable}
              key={`${field.variable}-${index}`}
              validators={field.validation}
            >
              {() => (
                <Suspense>
                  <FieldComponent
                    label={field.label}
                    fieldLabel={field.fieldLabel}
                    options={field.options}
                    parameters={field.parameters}
                    autoFocus={field.isFirst}
                    disabled={disabled}
                    type={field.type}
                  />
                </Suspense>
              )}
            </form.AppField>
          );
        })}
        {submitButton}
      </form>
    </div>
  );
};

export default Form;
