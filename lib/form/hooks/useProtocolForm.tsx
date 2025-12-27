import {
  type ComponentType,
  type FormField,
} from '@codaco/protocol-validation';
import { useSelector } from 'react-redux';
import {
  getValidationContext,
  selectFieldMetadata,
} from '~/lib/interviewer/selectors/forms';
import Field from '../components/Field/Field';
import {
  type FieldValue,
  type ValidationPropsCatalogue,
} from '../components/Field/types';
import BooleanField from '../components/fields/Boolean';
import CheckboxGroupField from '../components/fields/CheckboxGroup';
import DatePickerField from '../components/fields/DatePicker';
import InputField from '../components/fields/InputField';
import LikertScaleField from '../components/fields/LikertScale';
import RadioGroupField from '../components/fields/RadioGroup';
import RelativeDatePickerField from '../components/fields/RelativeDatePicker';
import TextAreaField from '../components/fields/TextArea';
import ToggleButtonGroupField from '../components/fields/ToggleButtonGroup';
import ToggleField from '../components/fields/ToggleField';
import VisualAnalogScaleField from '../components/fields/VisualAnalogScale';
import { type ValidationContext } from '../store/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldTypeMap: Record<ComponentType, React.ComponentType<any>> = {
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

/**
 * Hook to automatically convert protocol form definitions into the new form
 * system by generating Field components with validation props.
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
  const validationContext = useSelector(
    getValidationContext,
  ) as ValidationContext | null;

  const fieldsMetadata = useSelector((state) =>
    selectFieldMetadata(state, fields),
  );

  const fieldsWithMetadata = fieldsMetadata.map((field, index) => {
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
      initialValue?: FieldValue;
      autoFocus?: boolean;
      validationContext?: ValidationContext;
    } & Partial<ValidationPropsCatalogue> = {
      name: field.variable,
      label: field.label,
      component: field.component,
    };

    // Set autoFocus on the first field if requested
    if (autoFocus && index === 0) {
      props.autoFocus = true;
    }

    // Set initial value if provided
    if (initialValues?.[field.variable] !== undefined) {
      props.initialValue = initialValues[field.variable];
    }

    // Pass validation properties directly from the protocol validation object
    if ('validation' in field && field.validation) {
      const validation = field.validation as Record<string, unknown>;

      if (validation.required !== undefined)
        props.required = validation.required as boolean;
      if (validation.minLength !== undefined)
        props.minLength = validation.minLength as number;
      if (validation.maxLength !== undefined)
        props.maxLength = validation.maxLength as number;
      if (validation.minValue !== undefined)
        props.minValue = validation.minValue as number;
      if (validation.maxValue !== undefined)
        props.maxValue = validation.maxValue as number;
      if (validation.minSelected !== undefined)
        props.minSelected = validation.minSelected as number;
      if (validation.maxSelected !== undefined)
        props.maxSelected = validation.maxSelected as number;
      if (validation.pattern !== undefined)
        props.pattern =
          validation.pattern as ValidationPropsCatalogue['pattern'];
      // For 'unique', the protocol uses boolean but validation needs the attribute name
      if (validation.unique === true) props.unique = field.variable;
      if (validation.differentFrom !== undefined)
        props.differentFrom = validation.differentFrom as string;
      if (validation.sameAs !== undefined)
        props.sameAs = validation.sameAs as string;
      if (validation.greaterThanVariable !== undefined)
        props.greaterThanVariable = validation.greaterThanVariable as string;
      if (validation.lessThanVariable !== undefined)
        props.lessThanVariable = validation.lessThanVariable as string;
    }

    // Pass validation context for context-dependent validations (unique, sameAs, differentFrom, etc.)
    if (validationContext) {
      props.validationContext = validationContext;
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
    ({ component, ...fieldProps }, index) => {
      const FieldComponent = fieldTypeMap[component as ComponentType];

      return <Field key={index} {...fieldProps} component={FieldComponent} />;
    },
  );

  return { fieldComponents };
}
