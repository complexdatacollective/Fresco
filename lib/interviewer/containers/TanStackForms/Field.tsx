import {
  type ComponentType,
  ComponentTypes,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useStore } from 'react-redux';
import * as Fields from '~/lib/ui/components/Fields';
import { type AppStore } from '../../store';
import {
  getValidation,
  ValidationFunction,
  type VariableValidation,
} from '../../utils/field-validation';

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

type FieldProps = {
  fieldLabel?: string;
  name: string;
  component: ComponentType;
  validation?: VariableValidation;
  validate?: ValidationFunction;

  type: VariableType;
  value: VariableValue;
  options?: { label: string; value: VariableValue }[];
};

const Field = ({
  field: fieldProps,
  form,
  autoFocus,
}: {
  field: FieldProps;
  key?: string;
  form: any; //todo: type this properly
  autoFocus?: boolean;
}) => {
  const { fieldLabel, name, component, validation, options, validate } =
    fieldProps;
  console.log(validate);
  const store = useStore() as AppStore;
  const InputComponent = useMemo(
    () => getInputComponent(component),
    [component],
  );
  const validateFunction = useMemo(
    () => validate ?? getValidation(validation ?? {}, store),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store],
  );

  console.log('validate funciton', validation, validateFunction);

  return (
    <form.Field
      name={name}
      validators={{
        onBlur: ({ value }) => validateFunction(value),
      }}
      children={(field) => {
        const inputProps = {
          input: {
            name,
            value: field.state.value,
            onChange: (valueOrEvent: any) => {
              // event for text inputs, etc
              if (valueOrEvent?.target !== undefined) {
                field.handleChange(valueOrEvent.target.value);
              } else {
                //  toggle buttons, radio groups, etc
                field.handleChange(valueOrEvent);
              }
            },
          },
          meta: {
            error: field.state.meta.errors?.[0]?.message || null, // pass validation errors if invalid is true
            invalid: !field.state.meta.isValid,
            touched: field.state.meta.isTouched,
          },
          label: fieldLabel,
          fieldLabel,
          options,
          autoFocus,
        };

        return <InputComponent {...inputProps} />;
      }}
    />
  );
};

export default Field;
