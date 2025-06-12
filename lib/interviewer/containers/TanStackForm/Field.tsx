import { type VariableValue } from '@codaco/shared-consts';
import { useFieldContext } from '../../utils/formContexts';
import type { FieldProps, InputComponentProps } from './types';

const Field = ({ field, autoFocus }: FieldProps) => {
  const fieldContext = useFieldContext();
  const { fieldLabel, name, component, options, type, parameters, label, Component } =
    field;

  // Use pre-resolved component if available, otherwise fallback to runtime resolution
  if (!Component) {
    throw new Error(`Component not resolved for field: ${name}`);
  }

  const inputProps: InputComponentProps = {
    input: {
      name,
      value: fieldContext.state.value as VariableValue,
      onChange: (value: VariableValue) => fieldContext.handleChange(value),
      onBlur: () => {
        if (component === 'Slider') {
          fieldContext.handleBlur();
        }
      },
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
    type,
  };

  return <Component {...inputProps} />;
};

export default Field;
