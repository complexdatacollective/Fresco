import {
  ComponentTypes,
  type ComponentType,
  type VariableType,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { type ReactFormExtendedApi } from '@tanstack/react-form';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { useStore as useReduxStore } from 'react-redux';
import { type AppStore } from '~/lib/interviewer/store';
import {
  getValidation,
  type ValidationFunction,
  type VariableValidation,
} from '~/lib/interviewer/utils/field-validation';
import * as Fields from '~/lib/ui/components/Fields';

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
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >; // todo: see if this can be simplified or made more specific

  autoFocus?: boolean;
}) => {
  const { fieldLabel, name, component, validation, options, validate } =
    fieldProps;
  const store = useReduxStore() as AppStore;
  const InputComponent = useMemo<React.ComponentType<any>>(
    () => getInputComponent(component),
    [component],
  );

  let validationVariables;
  if (typeof validation === 'object') {
    validationVariables = Object.values(validation) as string[];
  }

  const validations = useMemo(
    () => validate ?? getValidation(validation ?? {}, store),
    [validate, validation, store],
  );

  const validators = validations
    ? {
        onChangeListenTo: validationVariables,
        onChange: ({ value }: { value: VariableValue }) => {
          const validationFunctions = Array.isArray(validations)
            ? validations
            : [validations];
          return validationFunctions
            .map((validationFunction) =>
              validationFunction(value, form.store.state.values, {}, name),
            )
            .find(Boolean);
        },
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
              const value =
                typeof valueOrEvent === 'object' &&
                valueOrEvent !== null &&
                'target' in valueOrEvent
                  ? (valueOrEvent as React.ChangeEvent<HTMLInputElement>).target
                      .value
                  : valueOrEvent;
              field.handleChange(value);
            },
          },
          meta: {
            error: field.state.meta.errors[0] ?? null, // show first error only
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
