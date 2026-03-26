'use client';

import { useSelector } from 'react-redux';
import Field from '~/lib/form/components/Field/Field';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { type CustomFieldValidation } from '~/lib/form/store/types';
import {
  getBiologicalSexOptions,
  getResolvedNodeFormFields,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  Text: InputField,
  Number: NumberCounterField,
  RadioGroup: RadioGroupField,
  Boolean: BooleanField,
};

type PersonFieldsProps = {
  index: number;
  prefix: string;
  initial?: { name?: string; sex?: string };
  showName?: boolean;
  sexCustomValidation?: CustomFieldValidation | CustomFieldValidation[];
};

export default function PersonFields({
  index,
  prefix,
  initial,
  showName = true,
  sexCustomValidation,
}: PersonFieldsProps) {
  const sexOptions = useSelector(getBiologicalSexOptions);
  const formFields = useSelector(getResolvedNodeFormFields);

  return (
    <>
      {showName && (
        <Field
          name={`${prefix}-${index}-name`}
          label="Name"
          component={InputField}
          placeholder="Enter name"
          autoFocus
          initialValue={initial?.name ?? ''}
          required
        />
      )}
      <Field
        name={`${prefix}-${index}-sex`}
        label="Sex assigned at birth"
        component={RadioGroupField}
        options={sexOptions}
        initialValue={initial?.sex}
        required
        custom={sexCustomValidation}
        validateOnChange
      />
      {formFields.map((field) => {
        const Component = COMPONENT_MAP[field.component];
        if (!Component) return null;
        return (
          <Field
            key={field.variableId}
            name={`${prefix}-${index}-${field.variableId}`}
            label={field.prompt}
            component={Component}
            options={field.options}
            required={field.validation?.required === true}
          />
        );
      })}
    </>
  );
}
