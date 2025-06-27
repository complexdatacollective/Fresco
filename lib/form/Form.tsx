import Field from '~/lib/form/Field';
import { useFormData } from '~/lib/form/hooks/useFormData';
import { useTanStackForm } from '~/lib/form/hooks/useTanStackForm';
import type { FormProps, TanStackFormErrors } from '~/lib/form/types';
import { scrollToFirstError } from '~/lib/form/utils/scrollToFirstError';

const Form = ({
  fields,
  handleFormSubmit,
  submitButton = <button type="submit" key="submit" aria-label="Submit" />,
  initialValues,
  autoFocus,
  disabled,
  id,
  entityId,
}: FormProps) => {
  const { defaultValues, fieldsWithProps } = useFormData({
    fields,
    entityId,
    initialValues,
    autoFocus,
  });

  const form = useTanStackForm({
    defaultValues,
    onSubmit: ({ value }) => handleFormSubmit(value),
    onSubmitInvalid: ({ formApi }) => {
      const errors = formApi.getAllErrors().fields as TanStackFormErrors;
      scrollToFirstError(errors);
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
        {fieldsWithProps.map((field, index) => (
          <form.AppField
            name={field.name}
            key={`${field.name}-${index}`}
            validators={field.validators}
          >
            {() => (
              <Field
                field={field}
                autoFocus={field.isFirst}
                disabled={disabled}
              />
            )}
          </form.AppField>
        ))}
        {submitButton}
      </form>
    </div>
  );
};

export default Form;
