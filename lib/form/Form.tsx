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
  const { defaultValues, enrichedFields } = useFormData({
    fields,
    entityId,
    initialValues,
    autoFocus,
  });

  const form = useTanStackForm({
    defaultValues,
    onSubmit: handleFormSubmit,
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
        {enrichedFields.map((field, index) => {
          if (!field.Component) {
            throw new Error(`Component not resolved for field: ${field.name}`);
          }

          const FieldComponent = field.Component;

          return (
            <form.AppField
              name={field.name}
              key={`${field.name}-${index}`}
              validators={field.validators}
            >
              {() => (
                <FieldComponent
                  label={field.label}
                  fieldLabel={field.fieldLabel}
                  options={field.options}
                  parameters={field.parameters}
                  autoFocus={field.isFirst}
                  disabled={disabled}
                  type={field.type}
                />
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
