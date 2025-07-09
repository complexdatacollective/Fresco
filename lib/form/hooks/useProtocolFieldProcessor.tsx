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
import FieldSkeleton from '~/lib/form/components/FieldSkeleton';

const BooleanField = dynamic(() => import('~/lib/form/fields/Boolean'), {
  loading: () => <FieldSkeleton type="boolean" />,
});
const CheckboxField = dynamic(() => import('~/lib/form/fields/Checkbox'), {
  loading: () => <FieldSkeleton type="checkbox" />,
});
const CheckboxGroupField = dynamic(() => import('~/lib/form/fields/CheckboxGroup'), {
  loading: () => <FieldSkeleton type="checkbox" />,
});
const DatePickerField = dynamic(() => import('~/lib/form/fields/DatePicker'), {
  loading: () => <FieldSkeleton />,
});
const LikertScaleField = dynamic(() => import('~/lib/form/fields/LikertScale'), {
  loading: () => <FieldSkeleton type="slider" />,
});
const MarkdownField = dynamic(() => import('~/lib/form/fields/Markdown'), {
  loading: () => <FieldSkeleton />,
});
const MarkdownLabelField = dynamic(() => import('~/lib/form/fields/MarkdownLabel'), {
  loading: () => <FieldSkeleton />,
});
const NumberField = dynamic(() => import('~/lib/form/fields/Number'), {
  loading: () => <FieldSkeleton />,
});
const RadioField = dynamic(() => import('~/lib/form/fields/Radio'), {
  loading: () => <FieldSkeleton type="radio" />,
});
const RadioGroupField = dynamic(() => import('~/lib/form/fields/RadioGroup'), {
  loading: () => <FieldSkeleton type="radio" />,
});
const RelativeDatePickerField = dynamic(() => import('~/lib/form/fields/RelativeDatePicker'), {
  loading: () => <FieldSkeleton />,
});
const SearchField = dynamic(() => import('~/lib/form/fields/Search'), {
  loading: () => <FieldSkeleton />,
});
const SliderField = dynamic(() => import('~/lib/form/fields/Slider'), {
  loading: () => <FieldSkeleton type="slider" />,
});
const TextField = dynamic(() => import('~/lib/form/fields/Text'), {
  loading: () => <FieldSkeleton />,
});
const TextAreaField = dynamic(() => import('~/lib/form/fields/TextArea'), {
  loading: () => <FieldSkeleton type="textarea" />,
});
const ToggleField = dynamic(() => import('~/lib/form/fields/Toggle'), {
  loading: () => <FieldSkeleton type="toggle" />,
});
const ToggleButtonField = dynamic(() => import('~/lib/form/fields/ToggleButton'), {
  loading: () => <FieldSkeleton type="toggleButton" />,
});
const ToggleButtonGroupField = dynamic(() => import('~/lib/form/fields/ToggleButtonGroup'), {
  loading: () => <FieldSkeleton type="toggleButton" />,
});
const VisualAnalogScaleField = dynamic(() => import('~/lib/form/fields/VisualAnalogScale'), {
  loading: () => <FieldSkeleton type="slider" />,
});
const QuickAddField = dynamic(() => import('~/lib/form/fields/QuickAdd'), {
  loading: () => <FieldSkeleton />,
});

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
