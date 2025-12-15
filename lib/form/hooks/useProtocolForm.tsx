import {
  type ComponentType,
  type FormField,
  type ValidationName,
} from '@codaco/protocol-validation';
import { useSelector } from 'react-redux';
import z from 'zod';
import {
  getValidationContext,
  selectFieldMetadata,
} from '~/lib/interviewer/selectors/forms';
import Field from '../components/Field';
import { BooleanField } from '../components/fields/Boolean';
import { CheckboxGroupField } from '../components/fields/CheckboxGroup';
import { DatePickerField } from '../components/fields/DatePicker';
import { InputField } from '../components/fields/InputField';
import { LikertScaleField } from '../components/fields/LikertScale';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { RelativeDatePickerField } from '../components/fields/RelativeDatePicker';
import { TextAreaField } from '../components/fields/TextArea';
import { ToggleButtonGroupField } from '../components/fields/ToggleButtonGroup';
import { ToggleField } from '../components/fields/ToggleField';
import { VisualAnalogScaleField } from '../components/fields/VisualAnalogScale';
import { type FieldValidation, type FieldValue } from '../components/types';
import { type ValidationFunction, validations } from '../validation';

const fieldTypeMap: Record<ComponentType, React.ElementType> = {
  Text: InputField,
  TextArea: TextAreaField,
  Number: InputField,
  RadioGroup: RadioGroupField,
  CheckboxGroup: CheckboxGroupField,
  Boolean: BooleanField,
  Toggle: ToggleField,
  ToggleButtonGroup: ToggleButtonGroupField,
  VisualAnalogScale: VisualAnalogScaleField,
  LikertScale: LikertScaleField,
  DatePicker: DatePickerField,
  RelativeDatePicker: RelativeDatePickerField,
};

type FieldValidator = (
  fieldValue: unknown,
  formValues: Record<string, FieldValue>,
  ctx: z.RefinementCtx,
  fieldPath?: string[],
) => Promise<void>;

/**
 * Hook to automatically convert protocol form definitions into the new form
 * system by generating Field's and their validation functions.
 */
export default function useProtocolForm({
  fields,
  autoFocus = false,
  initialValues,
}: {
  fields: FormField[];
  autoFocus?: boolean;
  initialValues?: Record<string, FieldValue>;
}) {
  const validationContext = useSelector(getValidationContext);

  const fieldsMetadata = useSelector((state) =>
    selectFieldMetadata(state, fields),
  );

  // Create a map of field validators to avoid duplication
  const fieldValidators = new Map<string, FieldValidator>();

  // Helper function to create a validator for a field
  const createFieldValidator = (field: {
    variable: string;
    validation?: Record<string, unknown>;
  }): FieldValidator => {
    if (!field.validation) {
      return async () => {
        // No validation
      };
    }

    return async (fieldValue, formValues, ctx, fieldPath = []) => {
      const validationEntries = Object.entries(field.validation!);

      for (const [validationName, parameter] of validationEntries) {
        try {
          const validationFnFactory = validations[
            validationName as ValidationName
          ] as ValidationFunction<string | number | boolean>;

          const validationFn = validationFnFactory(
            parameter as string | number | boolean,
            validationContext,
          )(formValues);

          const result = await validationFn.safeParseAsync(fieldValue);

          if (!result.success && result.error) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                code: 'custom',
                message: issue.message,
                path: [...fieldPath, ...issue.path],
              });
            });
          }
        } catch (error) {
          ctx.addIssue({
            code: 'custom',
            message: 'An error occurred while validating.',
            path: fieldPath,
          });
        }
      }
    };
  };

  const fieldsWithMetadata = fieldsMetadata.map((field) => {
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
      initialValue?: FieldValue;
      showRequired?: boolean;
    } = {
      name: field.variable,
      label: field.label,
      component: field.component,
    };

    // Handle setting the required flag, which is shown by the label component
    props.showRequired = field.validation?.required === true;

    // Set initial value if provided
    if (initialValues?.[field.variable] !== undefined) {
      props.initialValue = initialValues[field.variable];
    }

    // Create and store the field validator
    if ('validation' in field && field.validation) {
      const validator = createFieldValidator(field);
      fieldValidators.set(field.variable, validator);

      // Create field-level validation function that uses the validator
      props.validation = (formValues) =>
        z.unknown().superRefine(async (value, ctx) => {
          await validator(value, formValues, ctx);
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

  // Create a Zod schema for the entire form
  // Reuse the field validators we created during the map
  const formSchema = z
    .record(z.string(), z.unknown())
    .superRefine(async (formValues, ctx) => {
      // Validate each field using the stored validators
      for (const [fieldName, validator] of fieldValidators.entries()) {
        const fieldValue = formValues[fieldName];
        await validator(
          fieldValue,
          formValues as Record<string, FieldValue>,
          ctx,
          [fieldName],
        );
      }
    });

  return { fieldComponents, formSchema };
}
