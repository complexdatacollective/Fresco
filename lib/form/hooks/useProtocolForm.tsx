import { type FormField } from '@codaco/protocol-validation';
import { useSelector } from 'react-redux';
import { selectFieldMetadata } from '~/lib/interviewer/selectors/forms';
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

const fieldTypeMap = {
  // Text inputs
  Text: InputField,
  TextArea: TextAreaField,
  Number: InputField,
  // Selection fields
  RadioGroup: RadioGroupField,
  CheckboxGroup: CheckboxGroupField,
  Boolean: BooleanField,
  Toggle: ToggleField,
  ToggleButtonGroup: ToggleButtonGroupField,
  // Scale fields
  Slider: SliderField,
  VisualAnalogScale: VisualAnalogScaleField,
  LikertScale: LikertScaleField,
  // Date fields
  DatePicker: DatePickerField,
  RelativeDatePicker: RelativeDatePickerField,
};

import React from 'react';
import { translateProtocolValidation } from '../utils/translateProtocolValidation';

type UseProtocolFormReturn = {
  fieldComponents: React.ReactElement[];
  formContext: Record<string, unknown>;
};

export default function useProtocolForm({
  fields,
  autoFocus = false,
}: {
  fields: FormField[];
  autoFocus?: boolean;
}): UseProtocolFormReturn {
  // const formContext = useSelector(getProtocolFormContext);
  const formContext = {};

  const fieldsWithMetadata = useSelector((state) =>
    selectFieldMetadata(state, fields),
  );

  const fieldComponents = fieldsWithMetadata.map(
    ({ component, ...fieldProps }, index) => {
      const FieldComponent = fieldTypeMap[component!];

      const validation = translateProtocolValidation(fieldProps, formContext);

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

  return {
    fieldComponents,
    formContext,
  };
}
