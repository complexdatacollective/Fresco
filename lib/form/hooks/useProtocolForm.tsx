import {
  type ComponentType,
  type FormField,
  type Validation,
  type ValidationName,
} from '@codaco/protocol-validation';
import { useSelector } from 'react-redux';
import z from 'zod';
import {
  getValidationContext,
  selectFieldMetadata,
} from '~/lib/interviewer/selectors/forms';
import { Field } from '../components';
import { BooleanField } from '../components/fields/Boolean';
import { CheckboxGroupField } from '../components/fields/CheckboxGroup';
import { DatePickerField } from '../components/fields/DatePicker';
import { InputField } from '../components/fields/Input';
import { LikertScaleField } from '../components/fields/LikertScale';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { RelativeDatePickerField } from '../components/fields/RelativeDatePicker';
import { SliderField } from '../components/fields/Slider';
import { TextAreaField } from '../components/fields/TextArea';
import { ToggleField } from '../components/fields/Toggle';
import { ToggleButtonGroupField } from '../components/fields/ToggleButtonGroup';
import { VisualAnalogScaleField } from '../components/fields/VisualAnalogScale';
import { type FieldValidation } from '../types';
import { validations } from '../validation';

const fieldTypeMap: Record<ComponentType, React.ElementType> = {
  Text: InputField,
  TextArea: TextAreaField,
  Number: InputField,
  RadioGroup: RadioGroupField,
  CheckboxGroup: CheckboxGroupField,
  Boolean: BooleanField,
  Toggle: ToggleField,
  ToggleButtonGroup: ToggleButtonGroupField,
  Slider: SliderField,
  VisualAnalogScale: VisualAnalogScaleField,
  LikertScale: LikertScaleField,
  DatePicker: DatePickerField,
  RelativeDatePicker: RelativeDatePickerField,
};

export default function useProtocolForm({
  fields,
  autoFocus = false,
}: {
  fields: FormField[];
  autoFocus?: boolean;
}) {
  const validationContext = useSelector(getValidationContext);

  const fieldsWithMetadata = useSelector((state) =>
    selectFieldMetadata(state, fields),
  ).map((field) => {
    const props: {
      name: string;
      label: string;
      component?: string;
      options?: unknown[];
      useColumns?: boolean;
      type?: string;
      minLabel?: string;
      maxLabel?: string;
      min?: string;
      max?: string;
      before?: number;
      after?: number;
      validation?: FieldValidation;
    } = {
      name: field.name,
      label: field.label,
      component: field.component,
    };

    // process validation
    if (field.validation) {
      props.validation = (formValues) =>
        z.unknown().superRefine(async (value, ctx) => {
          Object.entries(field.validation as Validation).forEach(
            async ([validationName, parameter]) => {
              try {
                const validationFnFactory =
                  validations[validationName as ValidationName];
                const validationFn = validationFnFactory(
                  parameter,
                  validationContext,
                )(formValues);

                const result = await validationFn.safeParseAsync(value);

                if (!result.success && result.error) {
                  result.error.issues.forEach((issue) => {
                    ctx.addIssue({
                      code: 'custom',
                      message: issue.message,
                      path: [field.name, ...issue.path],
                    });
                  });
                }
              } catch (error) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'An error occurred while validating.',
                  path: [field.name],
                });
              }
            },
          );
        });
    }

    // Process ordinal and categorical options
    if ('options' in field) props.options = field.options;

    // Turn on columns if there are more than 6 options. Maybe a bad idea?
    if (
      (field.component === 'CheckboxGroup' ||
        field.component === 'RadioGroup') &&
      field.options.length > 6
    ) {
      props.useColumns ??= true;
    }

    // Handle number inputs
    if (field.type === 'number') {
      props.type = 'number';
    }

    if (field.type === 'scalar') {
      props.type = 'range';
    }

    // Handle VisualAnalogScale parameters
    if (field.component === 'VisualAnalogScale' && field.parameters) {
      const params = field.parameters;
      if (params.minLabel) props.minLabel = params.minLabel;
      if (params.maxLabel) props.maxLabel = params.maxLabel;
    }

    // Handle DatePicker parameters
    if (field.component === 'DatePicker' && field.parameters) {
      const params = field.parameters;
      if (params.min) props.min = params.min;
      if (params.max) props.max = params.max;
      if (params.type) props.type = params.type;
    }

    // Handle RelativeDatePicker parameters
    if (field.component === 'RelativeDatePicker' && field.parameters) {
      const params = field.parameters;
      if (params.before !== undefined) props.before = params.before;
      if (params.after !== undefined) props.after = params.after;
    }

    return props;
  });

  const fieldComponents = fieldsWithMetadata.map(
    ({ component, validation, ...fieldProps }, index) => {
      const FieldComponent = fieldTypeMap[component as ComponentType];

      const autoFocusField = autoFocus && index === 0;

      return (
        <Field
          key={index}
          {...fieldProps}
          validation={validation}
          Component={FieldComponent}
          autoFocus={autoFocusField}
        />
      );
    },
  );

  return fieldComponents;
}
