import {
  ComponentTypes,
  type ComponentType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import * as Fields from '~/lib/ui/components/Fields';
import { useFieldContext } from '../../hooks/useTanStackForm';
import { FieldType } from './Form';

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

/**
 * Renders a tanstack form field in the style of our app.
 * @param {string} label Presentational label
 * @param {string} name Property name
 * @param {string} component Field component
 * @param {string} placeholder Presentational placeholder text
 * @param {object} validation Validation methods
 */

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
      onBlur: (value?: VariableValue) => {
        // todo: come up with a better way to handle this
        // need system for different input types
        // this check is current workaround for issues with text inputs
        if (type === 'number' || type === 'scalar' || type === 'ordinal') {
          // sliders - value is passed directly to onBlur
          if (value !== undefined) {
            field.handleChange(value);
          }
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
