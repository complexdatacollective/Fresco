import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import React, { useMemo } from 'react';
import { useStore as useReduxStore, useSelector } from 'react-redux';
import * as Fields from '~/lib/ui/components/Fields';
import type { FieldType, FormField, InputComponentProps } from '../../containers/TanStackForm/types';
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
    return React.createElement('div', {}, `Input component "${componentType}" not found.`);
  };
  NotFoundComponent.displayName = `ComponentTypeNotFound(${componentType})`;
  return NotFoundComponent;
};

const getInputComponent = (componentType: ComponentType = 'Text') => {
  const def = get(ComponentTypes, componentType);
  return get(Fields, def, ComponentTypeNotFound(componentType));
};

export type UseFormDataReturn = {
  enrichedFields: FieldType[];
  validationContext: ValidationContext;
  defaultValues: Record<string, VariableValue>;
  fieldsWithProps: (FieldType & {
    isFirst?: boolean;
    validators: ReturnType<typeof getTanStackNativeValidators>;
  })[];
};

export type UseFormDataOptions = {
  fields: FormField[];
  entityId?: string;
  initialValues?: Record<string, VariableValue>;
  autoFocus?: boolean;
};

/**
 * Custom hook that extracts and centralizes form data management logic.
 * This includes field enrichment, validation context creation, and default value computation.
 *
 */
export const useFormData = ({
  fields,
  entityId,
  initialValues,
  autoFocus,
}: UseFormDataOptions): UseFormDataReturn => {
  const store = useReduxStore() as AppStore;
  const subject = useSelector(getStageSubject);

  // Create validation context with memoized data
  const validationContext = useMemo((): ValidationContext => {
    const state = store.getState();
    return {
      codebookVariables: getCodebookVariablesForSubjectType(state),
      networkEntities: getNetworkEntitiesForType(state),
      currentEntityId: entityId,
    };
  }, [store, entityId]);

  // Get enriched fields from Redux selector
  const enrichedFields = useSelector(
    (state): FieldType[] =>
      makeEnrichFieldsWithCodebookMetadata()(state, {
        fields,
        subject,
      }) as FieldType[],
  );

  // Process fields and compute default values
  const { defaultValues, fieldsWithProps } = useMemo(() => {
    const defaults: Record<string, VariableValue> = {};
    const processedFields = enrichedFields.map((field, index) => {
      // Build default values
      defaults[field.name] = initialValues?.[field.name] ?? '';

      // Pre-resolve component to avoid runtime lookups
      const Component = getInputComponent(field.component) as React.ComponentType<InputComponentProps>;

      // Return field with additional props
      return {
        ...field,
        Component,
        isFirst: autoFocus && index === 0,
        validators: getTanStackNativeValidators(
          field.validation ?? {},
          validationContext,
        ),
      };
    });

    return { defaultValues: defaults, fieldsWithProps: processedFields };
  }, [enrichedFields, initialValues, autoFocus, validationContext]);

  return {
    enrichedFields,
    validationContext,
    defaultValues,
    fieldsWithProps,
  };
};
