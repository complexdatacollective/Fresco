import {
  type ComponentType,
  ComponentTypes,
} from '@codaco/protocol-validation';
import { type VariableValue } from '@codaco/shared-consts';
import { get } from 'es-toolkit/compat';
import dynamic from 'next/dynamic';
import React from 'react';
import { useSelector } from 'react-redux';
import type {
  FieldComponentProps,
  FormField,
  ProcessedFormField,
  ProtocolField,
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
  const def = get(ComponentTypes, componentType) as string;
  
  switch (def) {
    case 'Boolean':
      return dynamic(() => import('~/lib/form/fields/Boolean'));
    case 'Checkbox':
      return dynamic(() => import('~/lib/form/fields/Checkbox'));
    case 'CheckboxGroup':
      return dynamic(() => import('~/lib/form/fields/CheckboxGroup'));
    case 'DatePicker':
      return dynamic(() => import('~/lib/form/fields/DatePicker'));
    case 'LikertScale':
      return dynamic(() => import('~/lib/form/fields/LikertScale'));
    case 'Markdown':
      return dynamic(() => import('~/lib/form/fields/Markdown'));
    case 'MarkdownLabel':
      return dynamic(() => import('~/lib/form/fields/MarkdownLabel'));
    case 'Number':
      return dynamic(() => import('~/lib/form/fields/Number'));
    case 'Radio':
      return dynamic(() => import('~/lib/form/fields/Radio'));
    case 'RadioGroup':
      return dynamic(() => import('~/lib/form/fields/RadioGroup'));
    case 'RelativeDatePicker':
      return dynamic(() => import('~/lib/form/fields/RelativeDatePicker'));
    case 'Search':
      return dynamic(() => import('~/lib/form/fields/Search'));
    case 'Slider':
      return dynamic(() => import('~/lib/form/fields/Slider'));
    case 'Text':
      return dynamic(() => import('~/lib/form/fields/Text'));
    case 'TextArea':
      return dynamic(() => import('~/lib/form/fields/TextArea'));
    case 'Toggle':
      return dynamic(() => import('~/lib/form/fields/Toggle'));
    case 'ToggleButton':
      return dynamic(() => import('~/lib/form/fields/ToggleButton'));
    case 'ToggleButtonGroup':
      return dynamic(() => import('~/lib/form/fields/ToggleButtonGroup'));
    case 'VisualAnalogScale':
      return dynamic(() => import('~/lib/form/fields/VisualAnalogScale'));
    case 'QuickAdd':
      return dynamic(() => import('~/lib/form/fields/QuickAdd'));
    default:
      return ComponentTypeNotFound(componentType);
  }
};

export type ValidationMetadata = {
  entityId?: string;
};

export type UseProcessProtocolFieldsOptions = {
  fields: FormField[];
  validationMeta?: ValidationMetadata;
};

export const useProtocolFieldProcessor = ({
  fields,
  validationMeta,
}: UseProcessProtocolFieldsOptions): ProcessedFormField[] => {
  const subject = useSelector(getStageSubject);
  const codebookVariables = useSelector(getCodebookVariablesForSubjectType);
  const networkEntities = useSelector(getNetworkEntitiesForType);

  const baseFields = useSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    enrichFieldsWithCodebookMetadata(state, {
      fields,
      subject,
    }),
  ) as ProtocolField[];

  const validationContext: ValidationContext = {
    codebookVariables,
    networkEntities,
    currentEntityId: validationMeta?.entityId,
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
            form: {
              store: { state: { values: Record<string, VariableValue> } };
            };
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
      options:
        field.type === 'categorical' || field.type === 'ordinal'
          ? field.options
          : undefined,
      parameters: field.parameters,
      type: field.type,
      onBlur: fields[index]?.onBlur,
    };
  });
};
