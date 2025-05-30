import {
  type ComponentType,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useForm } from '@tanstack/react-form';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeRehydrateFields } from '../../selectors/forms';
import type { VariableValidation } from '../../utils/field-validation';
import Field from './Field';

type Field = {
  prompt: string;
  variable: string;
};

export type FieldType = {
  prompt: string;
  name: string;
  component: ComponentType;
  placeholder?: string;
  variable?: string;
  value?: VariableValue;
  subject?: { entity: string; type?: string };
  validation?: VariableValidation;
  type: VariableType;
};

const TanStackForm = ({
  fields,
  subject,
  onSubmit: handleFormSubmit,
  submitButton = <button type="submit" key="submit" aria-label="Submit" />,
  initialValues,
  autoFocus,
  id,
}: {
  fields: Field[];
  subject?: { entity: string; type?: string };
  onSubmit: (formData: Record<string, VariableValue>) => void;
  submitButton?: React.ReactNode;
  initialValues?: VariableValue[];
  autoFocus?: boolean;
  id?: string;
}) => {
  const rehydrateFields = useMemo(() => makeRehydrateFields(), []);

  const rehydratedFields = useSelector((state) => {
    const result = rehydrateFields(state, { fields, subject });
    return result;
  }) as FieldType; // todo: type this

  const defaultValues = useMemo(() => {
    const defaults: Record<string, VariableValue> = {};
    rehydratedFields.forEach((field: FieldType) => {
      defaults[field.name] = initialValues?.[field.name] ?? field.value ?? '';
    });
    return defaults;
  }, [rehydratedFields, initialValues]);

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      // will only be called if validation passes
      handleFormSubmit(value);
    },
  });

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
        {rehydratedFields.map((field: FieldType, index: number) => {
          const isFirst = autoFocus && index === 0;
          return (
            <Field
              field={field}
              key={`${field.name} ${index}`}
              form={form}
              autoFocus={isFirst}
            />
          );
        })}
        {submitButton}
      </form>
    </div>
  );
};

export default TanStackForm;
