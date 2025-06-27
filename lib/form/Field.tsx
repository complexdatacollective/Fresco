import { type VariableValue } from '@codaco/shared-consts';
import type { FieldProps, InputComponentProps } from '~/lib/form/types';
import { useFieldContext } from '~/lib/form/utils/formContexts';

const Field = ({ field, autoFocus, disabled }: FieldProps) => {
  const fieldContext = useFieldContext();
  const {
    fieldLabel,
    name,
    options,
    type,
    parameters,
    label,
    Component,
    onBlur,
  } = field;

  // Use pre-resolved component if available, otherwise fallback to runtime resolution
  if (!Component) {
    throw new Error(`Component not resolved for field: ${name}`);
  }

  const inputProps: InputComponentProps = {
    input: {
      name,
      value: fieldContext.state.value as VariableValue,
      onChange: (value: VariableValue) => fieldContext.handleChange(value),
      onBlur: onBlur ?? fieldContext.handleBlur,
      onSubmit: () => fieldContext.form.handleSubmit(),
    },
    meta: {
      error: (fieldContext.state.meta.errors?.[0] as string) ?? null,
      invalid: !fieldContext.state.meta.isValid,
      touched: fieldContext.state.meta.isTouched,
    },
    label,
    fieldLabel,
    options,
    parameters,
    autoFocus,
    disabled,
    type,
  };

  return <Component {...inputProps} />;
};

export default Field;
