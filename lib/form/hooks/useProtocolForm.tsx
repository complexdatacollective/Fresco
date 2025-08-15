'use client';

import type { ComponentType } from '@codaco/protocol-validation';
import { useMemo } from 'react';
import Field from '../components/Field';
import { CheckboxGroupField } from '../components/fields/CheckboxGroup';
import { InputField } from '../components/fields/Input';
import { RadioGroupField } from '../components/fields/RadioGroup';
import { useStore } from 'react-redux';
import type { AppStore } from '~/lib/interviewer/store';
import type { FieldValue } from '../types';
import type { EnrichedFormField } from '../types/fields';
import { translateProtocolValidation } from '../utils/translateProtocolValidation';

export type UseProtocolFormOptions = {
  fields: EnrichedFormField[];
  subject?: { entity: string; type?: string };
  autoFocus?: boolean;
};

export type UseProtocolFormReturn = {
  fieldComponents: React.ReactElement[];
  additionalContext: Record<string, unknown>;
};

// Map protocol component types to new field components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldTypeMap: Record<ComponentType, React.ComponentType<any>> = {
  // Component types from protocol validation
  Text: InputField,
  TextArea: InputField, // todo - make component or variant
  Number: InputField, // todo
  RadioGroup: RadioGroupField,
  CheckboxGroup: CheckboxGroupField,
  Boolean: InputField, // todo
  Toggle: InputField, // todo
  ToggleButtonGroup: InputField,
  Slider: InputField, // todo
  VisualAnalogScale: InputField, // todo
  LikertScale: InputField, // todo
  DatePicker: InputField, // todo
  RelativeDatePicker: InputField, // todo
};


function extractAdditionalProps(
  field: EnrichedFormField,
  fieldType: ComponentType,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  if (field.placeholder) props.placeholder = field.placeholder;
  if (field.options) props.options = field.options;

  // Display hints from protocol
  if (field.displayHints) {
    const hints = field.displayHints;
    if (hints.size) props.size = hints.size;
    if (hints.orientation) props.orientation = hints.orientation;
    if (hints.variant) props.variant = hints.variant;
    if (hints.className) props.className = hints.className;
    if (hints.useColumns !== undefined) props.useColumns = hints.useColumns;
  }

  // Configure columns
  if (
    (fieldType === 'CheckboxGroup' || fieldType === 'RadioGroup') &&
    field.options &&
    field.options.length > 3 // todo: decide what this should be?
  ) {
    props.useColumns ??= true;
  }

  // Handle number inputs
  if (field.type === 'number' || fieldType === 'Number') {
    props.type = 'number';
  }

  // Handle date inputs
  if (
    field.type === 'datetime' ||
    fieldType === 'DatePicker' ||
    fieldType === 'RelativeDatePicker'
  ) {
    props.type = 'date';
  }

  if (field.type === 'scalar') {
    props.type = 'range';
  }

  return props;
}

/**
 * Hook to translate old field configurations to new Field components
 */
export function useProtocolForm({
  fields,
  subject,
  autoFocus = false,
}: UseProtocolFormOptions): UseProtocolFormReturn {
  // Get the store instance for validation context
  const storeInstance = useStore() as AppStore;
  
  // Build additional context for validation functions
  const additionalContext = useMemo(
    () => ({
      subject,
      store: storeInstance,
      ...(subject && { entity: subject.entity, entityType: subject.type }),
    }),
    [subject, storeInstance],
  );

  // Generate field components
  const fieldComponents = useMemo(() => {
    return fields.map((field, index) => {
      const fieldName = field.name;
      const fieldLabel = field.fieldLabel;

      const fieldType = field.component ?? field.type ?? 'Text';
      const Component = fieldTypeMap[fieldType as ComponentType];

      const validation = translateProtocolValidation(field);

      const additionalProps = extractAdditionalProps(
        field,
        fieldType as ComponentType,
      );

      // Add autoFocus to first field if enabled
      if (autoFocus && index === 0) {
        additionalProps.autoFocus = true;
      }

      return (
        <Field
          key={`${fieldName}-${index}`}
          name={fieldName}
          label={fieldLabel}
          initialValue={field.value as FieldValue}
          validation={validation}
          Component={Component}
          {...additionalProps}
        />
      );
    });
  }, [fields, autoFocus]);

  return {
    fieldComponents,
    additionalContext,
  };
}

export default useProtocolForm;
