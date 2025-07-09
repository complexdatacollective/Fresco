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

const BooleanField = dynamic(() => import('~/lib/form/fields/Boolean'));
const CheckboxField = dynamic(() => import('~/lib/form/fields/Checkbox'));
const CheckboxGroupField = dynamic(() => import('~/lib/form/fields/CheckboxGroup'));
const DatePickerField = dynamic(() => import('~/lib/form/fields/DatePicker'));
const LikertScaleField = dynamic(() => import('~/lib/form/fields/LikertScale'));
const MarkdownField = dynamic(() => import('~/lib/form/fields/Markdown'));
const MarkdownLabelField = dynamic(() => import('~/lib/form/fields/MarkdownLabel'));
const NumberField = dynamic(() => import('~/lib/form/fields/Number'));
const RadioField = dynamic(() => import('~/lib/form/fields/Radio'));
const RadioGroupField = dynamic(() => import('~/lib/form/fields/RadioGroup'));
const RelativeDatePickerField = dynamic(() => import('~/lib/form/fields/RelativeDatePicker'));
const SearchField = dynamic(() => import('~/lib/form/fields/Search'));
const SliderField = dynamic(() => import('~/lib/form/fields/Slider'));
const TextField = dynamic(() => import('~/lib/form/fields/Text'));
const TextAreaField = dynamic(() => import('~/lib/form/fields/TextArea'));
const ToggleField = dynamic(() => import('~/lib/form/fields/Toggle'));
const ToggleButtonField = dynamic(() => import('~/lib/form/fields/ToggleButton'));
const ToggleButtonGroupField = dynamic(() => import('~/lib/form/fields/ToggleButtonGroup'));
const VisualAnalogScaleField = dynamic(() => import('~/lib/form/fields/VisualAnalogScale'));
const QuickAddField = dynamic(() => import('~/lib/form/fields/QuickAdd'));

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
      return BooleanField;
    case 'Checkbox':
      return CheckboxField;
    case 'CheckboxGroup':
      return CheckboxGroupField;
    case 'DatePicker':
      return DatePickerField;
    case 'LikertScale':
      return LikertScaleField;
    case 'Markdown':
      return MarkdownField;
    case 'MarkdownLabel':
      return MarkdownLabelField;
    case 'Number':
      return NumberField;
    case 'Radio':
      return RadioField;
    case 'RadioGroup':
      return RadioGroupField;
    case 'RelativeDatePicker':
      return RelativeDatePickerField;
    case 'Search':
      return SearchField;
    case 'Slider':
      return SliderField;
    case 'Text':
      return TextField;
    case 'TextArea':
      return TextAreaField;
    case 'Toggle':
      return ToggleField;
    case 'ToggleButton':
      return ToggleButtonField;
    case 'ToggleButtonGroup':
      return ToggleButtonGroupField;
    case 'VisualAnalogScale':
      return VisualAnalogScaleField;
    case 'QuickAdd':
      return QuickAddField;
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
