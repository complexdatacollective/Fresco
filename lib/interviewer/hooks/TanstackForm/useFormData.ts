import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import React, { useMemo } from 'react';
import { useStore as useReduxStore, useSelector } from 'react-redux';
import * as Fields from '~/lib/ui/components/Fields';
import type {
  FieldType,
  FormField,
  InputComponentProps,
} from '../../containers/TanStackForm/types';
import { makeEnrichFieldsWithCodebookMetadata } from '../../selectors/forms';
import { getCodebookVariablesForSubjectType } from '../../selectors/protocol';
import {
  getNetworkEntitiesForType,
  getStageSubject,
} from '../../selectors/session';
import { type AppStore } from '../../store';
import { getTanStackNativeValidators } from '../../utils/field-validation';
import { type ValidationContext } from '../../utils/formContexts';

const ComponentTypeNotFound = (componentType: string) => {
  const NotFoundComponent = () => {
    return React.createElement(
      'div',
      {},
      `Input component "${componentType}" not found.`,
    );
  };
  NotFoundComponent.displayName = `ComponentTypeNotFound(${componentType})`;
  return NotFoundComponent;
};

const getInputComponent = (componentType: ComponentType = 'Text') => {
  const def = get(ComponentTypes, componentType);
  return get(Fields, def, ComponentTypeNotFound(componentType));
};

type UseFormDataReturn = {
  enrichedFields: FieldType[];
  validationContext: ValidationContext;
  defaultValues: Record<string, VariableValue>;
  fieldsWithProps: (FieldType & {
    isFirst?: boolean;
    validators: ReturnType<typeof getTanStackNativeValidators>;
  })[];
};

type UseFormDataOptions = {
  fields: FormField[];
  entityId?: string;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
};

/**
 * Custom hook that prepares field data for use in a TanStack Form.
 * - Enriches fields with metadata
 * - Creates validation context
 * - Prepares default values and input components
 * - Creates Tanstack Form validators for each field
 */
export const useFormData = ({
  fields,
  entityId,
  initialValues,
  autoFocus,
}: UseFormDataOptions): UseFormDataReturn => {
  const store = useReduxStore() as AppStore;
  const subject = useSelector(getStageSubject);

  return useMemo(() => {
    const state = store.getState();

    // Create validation context
    const validationContext: ValidationContext = {
      codebookVariables: getCodebookVariablesForSubjectType(state),
      networkEntities: getNetworkEntitiesForType(state),
      currentEntityId: entityId,
    };

    // Enrich and process fields in single step
    const enrichedFields = makeEnrichFieldsWithCodebookMetadata()(state, {
      fields,
      subject,
    }) as FieldType[];

    const defaults: Record<string, VariableValue> = {};
    const fieldsWithProps = enrichedFields.map((field, index) => {
      // Build default values
      defaults[field.name] = initialValues?.[field.name] ?? field.value ?? '';

      // Pre-resolve component
      const Component = getInputComponent(
        field.component,
      ) as React.ComponentType<InputComponentProps>;

      // Create validators
      const validators = getTanStackNativeValidators(
        field.validation ?? {},
        validationContext,
      );

      return {
        ...field,
        Component,
        isFirst: autoFocus && index === 0,
        validators,
      };
    });

    return {
      enrichedFields,
      validationContext,
      defaultValues: defaults,
      fieldsWithProps,
    };
  }, [fields, entityId, initialValues, autoFocus, store, subject]);
};
