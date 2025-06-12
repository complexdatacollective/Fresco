import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import * as Fields from '~/lib/ui/components/Fields';
import { useFieldContext } from '../../utils/formContexts';
import type { FieldProps, InputComponentProps } from './types';

const ComponentTypeNotFound = (componentType: string) => {
  const NotFoundComponent = () => (
    <div>Input component &quot;{componentType}&quot; not found.</div>
  );
  NotFoundComponent.displayName = `ComponentTypeNotFound(${componentType})`;
  return NotFoundComponent;
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

const Field = ({ field, autoFocus }: FieldProps) => {
  const fieldContext = useFieldContext();
  const { fieldLabel, name, component, options, type, parameters, label } =
    field;

  const InputComponent = useMemo<React.ComponentType<InputComponentProps>>(
    () =>
      getInputComponent(component) as React.ComponentType<InputComponentProps>,
    [component],
  );

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

  return <InputComponent {...inputProps} />;
};

export default Field;
