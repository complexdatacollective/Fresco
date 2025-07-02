import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import React from 'react';
import type { FieldComponentProps, FormField, ProcessedFormField, ProtocolField } from '~/lib/form/types';
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
import type { RootState } from '~/lib/interviewer/store';

const ComponentTypeNotFound = (componentType: string) => {
  const NotFoundComponent = () => {
    return React.createElement('div', {}, `Input component "${componentType}" not found.`);
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

export type ValidationMetadata = {
  entityId?: string;
};



export type ProcessProtocolFieldsOptions = {
  fields: FormField[];
  validationMeta: ValidationMetadata;
  autoFocus?: boolean;
  state: RootState;
};

export const processProtocolFields = ({
  fields,
  validationMeta,
  autoFocus,
  state,
}: ProcessProtocolFieldsOptions): ProcessedFormField[] => {
  const subject = getStageSubject(state);
  const codebookVariables = getCodebookVariablesForSubjectType(state);
  const networkEntities = getNetworkEntitiesForType(state);

  const baseFields = enrichFieldsWithCodebookMetadata(state, {
    fields,
    subject,
  }) as ProtocolField[];

  const validationContext: ValidationContext = {
    codebookVariables,
    networkEntities,
    currentEntityId: validationMeta.entityId,
  };

  return baseFields.map((field: ProtocolField, index: number) => {
    const Component =
      fields[index]?.Component ??
      (getInputComponent(
        field.component,
      ) as React.ComponentType<FieldComponentProps>);

    const validators = getTanStackNativeValidators(
      field.validation ?? {},
      validationContext,
    );

    const validation = {
      onChangeListenTo: validators.onChangeListenTo,
      onChange: (params: { value: VariableValue; fieldApi: unknown }) =>
        validators.onChange({
          value: params.value,
          fieldApi: params.fieldApi as {
            form: { store: { state: { values: Record<string, VariableValue> } } };
            name: string;
          },
        }),
    };

    return {
      variable: field.name,
      Component,
      validation,
      name: field.name,
      label: field.label,
      fieldLabel: field.fieldLabel,
      options: (field.type === 'categorical' || field.type === 'ordinal') ? field.options : undefined,
      parameters: field.parameters,
      type: field.type,
      isFirst: autoFocus && index === 0,
      onBlur: fields[index]?.onBlur,
    };
  });
};