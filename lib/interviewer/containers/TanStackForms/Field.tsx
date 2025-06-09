import {
  type ComponentType,
  ComponentTypes,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import * as Fields from '~/lib/ui/components/Fields';
import type {
  ValidationFunction,
  VariableValidation,
} from '../../utils/field-validation';
import { useFieldContext } from '../../utils/formContexts';

export type FieldType = {
  fieldLabel?: string;
  label?: string;
  name: string;
  component: ComponentType;
  validation?: VariableValidation;
  validate?: ValidationFunction;
  type: VariableType;
  value?: VariableValue;
  options?: { label: string; value: VariableValue }[];
  parameters: Record<string, unknown> | null;
};

const ComponentTypeNotFound = (componentType: string) => {
  const ComponentTypeNotFoundInner = () => (
    <div>Input component &quot;{componentType}&quot; not found.</div>
  );

  return ComponentTypeNotFoundInner;
};

/*
  * Returns the named field component, if no matching one is found
  or else it just returns a text input
  * @param {object} field The properties handed down from the protocol form
  */
const getInputComponent = (componentType: ComponentType = 'Text') => {
  const def = get(ComponentTypes, componentType);
  return get(Fields, def, ComponentTypeNotFound(componentType));
};

const Field = ({
  field: fieldProps,
  autoFocus,
}: {
  field: FieldType;
  key?: string;

  autoFocus?: boolean;
}) => {
  const field = useFieldContext<any>();

  const { fieldLabel, name, component, options, type, parameters, label } =
    fieldProps;
  const InputComponent = useMemo<React.ComponentType<any>>(
    () => getInputComponent(component),
    [component],
  );

  const inputProps = {
    input: {
      name,
      value: field.state.value,
      onChange: (value: VariableValue) => {
        field.handleChange(value);
      },
      onBlur: () => {
        if (component === 'Slider') {
          field.handleBlur();
        }
      },
    },
    meta: {
      error: field.state.meta.errors[0] ?? null, // show first error only
      invalid: !field.state.meta.isValid,
      touched: field.state.meta.isTouched,
    },
    label,
    fieldLabel,
    options,
    parameters,
    autoFocus,
    type,
  };

  return <InputComponent {...inputProps} />;
};

export default Field;
