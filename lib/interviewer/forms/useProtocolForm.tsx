import {
  type ComponentType,
  type FormField,
} from '@codaco/protocol-validation';
import { type ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getValidationContext,
  selectFieldMetadata,
  selectFieldMetadataWithSubject,
  type Subject,
} from '~/lib/interviewer/selectors/forms';
import Field from '@codaco/fresco-ui/form/Field/Field';
import {
  type FieldValue,
  type ValidationPropsCatalogue,
} from '@codaco/fresco-ui/form/Field/types';
import FieldNamespace from '@codaco/fresco-ui/form/FieldNamespace';
import BooleanField from '@codaco/fresco-ui/form/fields/Boolean';
import CheckboxGroupField from '@codaco/fresco-ui/form/fields/CheckboxGroup';
import DatePickerField from '@codaco/fresco-ui/form/fields/DatePicker';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import LikertScaleField from '@codaco/fresco-ui/form/fields/LikertScale';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import RelativeDatePickerField from '@codaco/fresco-ui/form/fields/RelativeDatePicker';
import TextAreaField from '@codaco/fresco-ui/form/fields/TextArea';
import ToggleButtonGroupField from '@codaco/fresco-ui/form/fields/ToggleButtonGroup';
import ToggleField from '@codaco/fresco-ui/form/fields/ToggleField';
import VisualAnalogScaleField from '@codaco/fresco-ui/form/fields/VisualAnalogScale';
import { type ValidationContext } from '@codaco/fresco-ui/form/store/types';
import { addDays, todayYmd } from '@codaco/fresco-ui/form/utils/ymd';

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
 *
 * @param fields - The form field definitions from the protocol
 * @param autoFocus - Whether to auto-focus the first field
 * @param initialValues - Initial values for the form fields
 * @param subject - Optional subject to use for looking up codebook variables.
 *                  If provided, uses subject from props instead of Redux state.
 *                  Required for SlidesForm where subject comes from item props.
 * @param namespace - Optional prefix for field names (e.g. "partner-0") to
 *                    avoid collisions when multiple instances share a form store.
 */
export default function useProtocolForm({
  fields,
  autoFocus = false,
  initialValues,
  subject,
  namespace,
  currentEntityId,
}: {
  fields: FormField[];
  autoFocus?: boolean;
  initialValues?: Record<string, FieldValue>;
  subject?: Subject;
  namespace?: string;
  currentEntityId?: string;
}) {
  const baseValidationContext = useSelector(
    getValidationContext,
  ) as ValidationContext | null;

  const validationContext = useMemo<ValidationContext | null>(() => {
    if (!baseValidationContext) return null;
    if (currentEntityId === undefined) return baseValidationContext;
    return { ...baseValidationContext, currentEntityId };
  }, [baseValidationContext, currentEntityId]);

  const fieldsMetadata = useSelector((state) =>
    subject
      ? selectFieldMetadataWithSubject(state, subject, fields)
      : selectFieldMetadata(state, fields),
  );

  const fieldsWithMetadata = fieldsMetadata.map((field, index) => {
    const fieldName = field.variable;

    const props: {
      name: string;
      label: string;
      hint?: string;
      showValidationHints?: boolean;
      component?: string;
      options?: unknown[];
      useColumns?: boolean;
      type?: string;
      minLabel?: string;
      maxLabel?: string;
      min?: string;
      max?: string;
      anchor?: string;
      before?: number;
      after?: number;
      initialValue?: FieldValue;
      autoFocus?: boolean;
      validationContext?: ValidationContext;
    } & Partial<ValidationPropsCatalogue> = {
      name: fieldName,
      label: field.label,
      component: field.component,
      ...(field.hint !== undefined && { hint: field.hint }),
      ...(field.showValidationHints !== undefined && {
        showValidationHints: field.showValidationHints,
      }),
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
        props.greaterThanVariable = {
          attribute: validation.greaterThanVariable as string,
          type: field.type,
        };
      if (validation.lessThanVariable !== undefined)
        props.lessThanVariable = {
          attribute: validation.lessThanVariable as string,
          type: field.type,
        };
      if (validation.greaterThanOrEqualToVariable !== undefined)
        props.greaterThanOrEqualToVariable = {
          attribute: validation.greaterThanOrEqualToVariable as string,
          type: field.type,
        };
      if (validation.lessThanOrEqualToVariable !== undefined)
        props.lessThanOrEqualToVariable = {
          attribute: validation.lessThanOrEqualToVariable as string,
          type: field.type,
        };
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

    // Handle RelativeDatePicker parameters. We forward anchor/before/after
    // to the component for its UI-side range calculation AND pre-compute
    // absolute min/max here so the Field-level min/max validators fire on
    // submission. Without this, RelativeDatePicker's internally-computed
    // min/max would only constrain the native picker UI — keyboard-typed
    // out-of-range values would pass through validation.
    if (field.component === 'RelativeDatePicker' && field.parameters) {
      const params = field.parameters;
      if (params.anchor !== undefined) props.anchor = params.anchor;
      if (params.before !== undefined) props.before = params.before;
      if (params.after !== undefined) props.after = params.after;

      const anchor = params.anchor ?? todayYmd();
      const before = params.before ?? 180;
      const after = params.after ?? 0;
      props.min = addDays(anchor, -before);
      props.max = addDays(anchor, after);
    }

    return props;
  });

  const renderedFields = fieldsWithMetadata.map(
    ({ component, ...fieldProps }, index) => {
      const FieldComponent = fieldTypeMap[component as ComponentType];

      return <Field key={index} {...fieldProps} component={FieldComponent} />;
    },
  );

  const fieldComponents: ReactNode = namespace ? (
    <FieldNamespace prefix={namespace}>{renderedFields}</FieldNamespace>
  ) : (
    renderedFields
  );

  return { fieldComponents };
}
