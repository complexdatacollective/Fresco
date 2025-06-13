import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { get } from 'es-toolkit/compat';
import { useMemo } from 'react';
import { Field as ReduxFormField } from 'redux-form';
import * as Fields from '~/lib/ui/components/Fields';
import {
  // getValidation,
  // type ValidationFunction,
  type VariableValidation,
} from '../utils/field-validation';

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
 * Renders a redux-form field in the style of our app.
 * @param {string} label Presentational label
 * @param {string} name Property name
 * @param {string} component Field component
 * @param {string} placeholder Presentational placeholder text
 * @param {object} validation Validation methods
 */

type FieldProps = {
  label?: string;
  name: string;
  component: ComponentType;
  placeholder?: string;
  validation?: VariableValidation;
  // validate?: ValidationFunction;
};
type FieldComponent = React.ComponentType<FieldProps>;

const Field: FieldComponent = ({
  label = '',
  name,
  // validation = {},
  ...rest
}) => {
  // const store = useStore() as AppStore;
  const component = useMemo(
    () => getInputComponent(rest.component),
    [rest.component],
  );
  // const validate = useMemo(
  //   () => rest.validate ?? getValidation(validation, store),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [store],
  // );

  return (
    <ReduxFormField
      {...rest}
      name={name}
      label={label}
      component={component}
      // validate={validate}
    />
  );
};

export default Field;
