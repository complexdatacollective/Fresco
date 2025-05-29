import { type ComponentType } from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { useForm } from '@tanstack/react-form';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeRehydrateFields } from '../../selectors/forms';
import Field from './Field';

type FieldType = {
  prompt: string;
  name: string;
  component: ComponentType;
  placeholder?: string;
  variable?: string;
  value?: any;
  subject?: { entity: string; type?: string };
  // validation?: any;
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
  fields: FieldType[];
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
  }); // todo: type this

  const defaultValues = useMemo(() => {
    const defaults: Record<string, VariableValue> = {};
    rehydratedFields.forEach((field: FieldType) => {
      defaults[field.name] = initialValues?.[field.name] ?? field.value ?? '';
    });
    return defaults;
  }, [rehydratedFields, initialValues]);

  const form = useForm({
    defaultValues,
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const formValues = form.state.values;
          handleFormSubmit(formValues);
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
