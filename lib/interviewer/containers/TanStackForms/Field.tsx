import {
  type ComponentType,
  ComponentTypes,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { type ReactFormExtendedApi } from '@tanstack/react-form';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useStore } from 'react-redux';
import * as Fields from '~/lib/ui/components/Fields';
import { type AppStore } from '../../store';
import {
  getValidation,
  type ValidationFunction,
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
  value?: VariableValue;
  options?: { label: string; value: VariableValue }[];
};

const Field = ({
  field: fieldProps,
  form,
  autoFocus,
}: {
  field: FieldProps;
  key?: string;
  form: ReactFormExtendedApi<
    Record<string, VariableValue>,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >; //todo fix type

  autoFocus?: boolean;
}) => {
  const { fieldLabel, name, component, validation, options, validate } =
    fieldProps;
  const store = useStore() as AppStore;
  const InputComponent = useMemo<React.ComponentType<any>>(
    () => getInputComponent(component),
    [component],
  );
  const validateFunction = useMemo(
    () => validate ?? getValidation(validation ?? {}, store),
    [validate, validation, store],
  );

  const validators = validateFunction[0]
    ? {
        onChange: ({ value }: { value: VariableValue }) =>
          validateFunction[0](value),
      }
    : {};

  return (
    <form.Field name={name} validators={validators}>
      {(field) => {
        const inputProps = {
          input: {
            name,
            value: field.state.value,
            onChange: (
              valueOrEvent: React.ChangeEvent<HTMLInputElement> | VariableValue,
            ) => {
              if (
                typeof valueOrEvent === 'object' &&
                valueOrEvent !== null &&
                'target' in valueOrEvent &&
                (valueOrEvent as React.ChangeEvent<HTMLInputElement>).target !==
                  undefined
              ) {
                field.handleChange(
                  (valueOrEvent as React.ChangeEvent<HTMLInputElement>).target
                    .value,
                );
              } else {
                //  toggle buttons, radio groups, etc
                field.handleChange(valueOrEvent as VariableValue);
              }
            },
          },
          meta: {
            error: field.state.meta.errors[0] ?? null, // todo: handle multiple errors
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
    </form.Field>
  );
};

export default Field;
