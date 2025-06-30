import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type {
  FieldType,
  FormField,
  InputComponentProps,
} from '~/lib/form/types';
import {
  getTanStackNativeValidators,
  type ValidationContext,
} from '~/lib/form/utils/fieldValidation';
import { enrichFieldsWithCodebookMetadata } from '~/lib/interviewer/selectors/forms';
import { getCodebookVariablesForSubjectType } from '~/lib/interviewer/selectors/protocol';
import {
  getNetworkEntitiesForType,
  getStageSubject,
} from '~/lib/interviewer/selectors/session';

const ComponentTypeNotFound = (componentType: string) => {
  const NotFoundComponent = () => {
    return <div>{`Input component "${componentType}" not found.`}</div>;
  };
  NotFoundComponent.displayName = `ComponentTypeNotFound(${componentType})`;
  return NotFoundComponent;
};

const lazyComponents = {
  Boolean: React.lazy(() => import('~/lib/form/fields/Boolean')),
  Checkbox: React.lazy(() => import('~/lib/form/fields/Checkbox')),
  CheckboxGroup: React.lazy(() => import('~/lib/form/fields/CheckboxGroup')),
  DatePicker: React.lazy(() => import('~/lib/form/fields/DatePicker')),
  LikertScale: React.lazy(() => import('~/lib/form/fields/LikertScale')),
  Markdown: React.lazy(() => import('~/lib/form/fields/Markdown')),
  MarkdownLabel: React.lazy(() => import('~/lib/form/fields/MarkdownLabel')),
  Number: React.lazy(() => import('~/lib/form/fields/Number')),
  Radio: React.lazy(() => import('~/lib/form/fields/Radio')),
  RadioGroup: React.lazy(() => import('~/lib/form/fields/RadioGroup')),
  RelativeDatePicker: React.lazy(
    () => import('~/lib/form/fields/RelativeDatePicker'),
  ),
  Search: React.lazy(() => import('~/lib/form/fields/Search')),
  Slider: React.lazy(() => import('~/lib/form/fields/Slider')),
  Text: React.lazy(() => import('~/lib/form/fields/Text')),
  TextArea: React.lazy(() => import('~/lib/form/fields/TextArea')),
  Toggle: React.lazy(() => import('~/lib/form/fields/Toggle')),
  ToggleButton: React.lazy(() => import('~/lib/form/fields/ToggleButton')),
  ToggleButtonGroup: React.lazy(
    () => import('~/lib/form/fields/ToggleButtonGroup'),
  ),
  VisualAnalogScale: React.lazy(
    () => import('~/lib/form/fields/VisualAnalogScale'),
  ),
  QuickAdd: React.lazy(() => import('~/lib/form/fields/QuickAdd')),
} as const;

const getInputComponent = (componentType: ComponentType = 'Text') => {
  const def = get(ComponentTypes, componentType);
  return (
    lazyComponents[def as keyof typeof lazyComponents] ||
    ComponentTypeNotFound(componentType)
  );
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
  const subject = useSelector(getStageSubject);
  const codebookVariables = useSelector(getCodebookVariablesForSubjectType);
  const networkEntities = useSelector(getNetworkEntitiesForType);
  const enrichedFields = useSelector((state) =>
    enrichFieldsWithCodebookMetadata(state, {
      fields,
      subject,
    }),
  );

  return useMemo(() => {
    // Create validation context
    const validationContext: ValidationContext = {
      codebookVariables,
      networkEntities,
      currentEntityId: entityId,
    };

    const defaults: Record<string, VariableValue> = {};
    const fieldsWithProps = enrichedFields.map(
      (field: FieldType, index: number) => {
        // Build default values
        defaults[field.name] = initialValues?.[field.name] ?? field.value ?? '';

        // Use passed Component if available, otherwise resolve from component type
        const Component =
          fields[index]?.Component ??
          (getInputComponent(
            field.component,
          ) as React.ComponentType<InputComponentProps>);

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
          onBlur: fields[index]?.onBlur, // Pass through custom onBlur handler
        };
      },
    );

    return {
      enrichedFields,
      validationContext,
      defaultValues: defaults,
      fieldsWithProps,
    };
  }, [
    enrichedFields,
    entityId,
    initialValues,
    autoFocus,
    codebookVariables,
    networkEntities,
    fields,
  ]);
};
